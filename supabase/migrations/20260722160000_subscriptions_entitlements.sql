-- Subscriptions / entitlements for the €4.99/mo unlimited tier.
-- Truth lives here, server-side. The client can never grant itself access:
-- the only writer is the service role (the Lemon Squeezy webhook).

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Lemon Squeezy identifiers, filled in by the webhook.
  ls_subscription_id text unique,
  ls_customer_id text,
  ls_variant_id text,
  -- 'active' and 'on_trial' mean the user is entitled. Others are gated.
  status text not null default 'none'
    check (status in ('none','on_trial','active','paused','past_due','unpaid','cancelled','expired')),
  -- When the current paid period ends (from LS). Access is honoured through this
  -- even after a cancel, since they paid for the period.
  renews_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- A user may read ONLY their own subscription row. No insert/update/delete
-- policies exist for anon/authenticated, so the Data API cannot write here at
-- all — only the service role (which bypasses RLS) can, via the webhook.
create policy "read own subscription"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Entitlement check, callable from the app as the logged-in user.
-- True when the caller has an active/trialing sub, or a cancelled-but-not-yet
-- -expired one (paid period still running).
create or replace function public.has_active_sub()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and (
        s.status in ('active','on_trial')
        or (s.status = 'cancelled' and coalesce(s.ends_at, 'infinity'::timestamptz) > now())
      )
  );
$$;

-- Let logged-in users ask "am I entitled?" but nothing else.
revoke execute on function public.has_active_sub() from public;
grant execute on function public.has_active_sub() to authenticated;

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();
