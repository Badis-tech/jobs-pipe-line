# Jobs Pipeline — Setup and Deployment Guide

This guide covers local development, Vercel deployment, and self-hosted deployment options for the jobs-pipe-line project.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Running Locally](#running-locally)
3. [Vercel Deployment](#vercel-deployment)
4. [Local Server Deployment](#local-server-deployment)

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** 9+ (comes with Node.js)
- **Git** (for cloning)

### Step 1: Clone or Open the Repository

**If starting from scratch:**

```bash
git clone <repository-url>
cd jobs-pipe-line
```

**If the folder is already on your machine:**

```bash
cd /path/to/jobs-pipe-line
```

### Step 2: Navigate to the Web Directory

All frontend commands run from the `web/` directory:

```bash
cd web
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`:
- Next.js 16
- React 19
- Tailwind CSS v4
- Supabase JS SDK
- TypeScript, ESLint, and dev tools

### Step 4: Set Up Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your Supabase credentials:

```env
# Get these from your Supabase project dashboard:
# Project Settings → API → URL and Anon Key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Where to find these values:**

1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy the **Project URL** (goes in `NEXT_PUBLIC_SUPABASE_URL`)
4. Copy the **Anon public** key (goes in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

**⚠️ Important:** These are public keys — safe to commit to git. Never put the `service_role` (secret) key in the frontend.

---

## Running Locally

### Start the Development Server

```bash
npm run dev
```

You should see output like:

```
  ▲ Next.js 16.2.10
  - Local:        http://localhost:3000
  - Environments: .env.local

  ✓ Ready in 1.23s
```

### Access the App

Open your browser to **http://localhost:3000**

The app will:
- Show job listings from the Supabase database
- Auto-refresh when you save code changes
- Display errors in the browser console

### Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Build for production |
| `npm run start` | Run the production build locally |
| `npm run lint` | Check code for linting errors |

### Stopping the Server

Press `Ctrl + C` in your terminal.

---

## Vercel Deployment

Vercel is the easiest way to deploy a Next.js app. It auto-scales, has edge caching, and integrates seamlessly with Next.js.

### Option A: Deploy from the CLI (Recommended for CI/CD)

**Prerequisites:**
- Vercel CLI installed: `npm install -g vercel`
- Vercel account linked: `vercel login`

**Deploy to preview:**

```bash
cd web
npx vercel deploy --prebuilt
```

**Deploy to production:**

```bash
cd web
npx vercel deploy --prod
```

The URL will be printed. Environment variables are already set in your Vercel project dashboard (no manual setup needed if you've linked it before).

### Option B: Deploy from Dashboard (Manual)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Click **Deploy**

### Option C: GitHub Integration (Continuous Deployment)

Once linked, every push to your repo automatically triggers a preview deployment. Merging to `main` deploys to production.

1. Connect your GitHub repo to Vercel (via dashboard)
2. Set environment variables in **Vercel Project Settings → Environment Variables**
3. Each commit auto-deploys
4. Production deploys on merge to `main` (configurable)

### Verify the Production Build

Before deploying, test the production build locally:

```bash
cd web
npm run build
npm run start
```

Visit **http://localhost:3000** — it should feel the same as `npm run dev`, but with optimizations applied.

### Environment Variables on Vercel

Environment variables are managed in the Vercel dashboard:

1. Go to your project dashboard at **vercel.com**
2. Click **Settings** → **Environment Variables**
3. Add:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`, Value: `https://your-project.supabase.co`
   - Key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, Value: `eyJhbGc...`
4. Click **Save**

These are automatically injected into your build.

### View Logs

To see deployment logs or runtime errors on Vercel:

```bash
vercel logs <url>
```

Or check the dashboard: **Deployments** tab → select a deployment → **Logs**.

---

## Local Server Deployment

Self-host the app on your own hardware or cloud VM (AWS, DigitalOcean, Linode, etc.).

### Option 1: Node.js Server (Simplest)

**Build the app:**

```bash
cd web
npm run build
```

This creates a `.next/` folder with the production build.

**Run the server:**

```bash
npm start
```

The app listens on **http://localhost:3000** by default.

**To expose to the internet:**

Use a reverse proxy like Nginx or Apache, or:

```bash
npm start -- -p 80  # Run on port 80 (requires sudo on Linux/Mac)
```

Or use port forwarding:

```bash
npm start -- -p 3000  # Run on port 3000
# Then route your domain to http://localhost:3000 via Nginx/HAProxy
```

### Option 2: Docker Container

Create a `Dockerfile` in the `web/` directory:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app code
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
```

**Build and run:**

```bash
cd web
docker build -t jobs-pipeline .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://..." \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..." \
  jobs-pipeline
```

**Using Docker Compose** (for easier orchestration):

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: eyJhbGc...
    restart: unless-stopped
```

Then:

```bash
docker-compose up -d
```

### Option 3: PM2 (Process Manager)

PM2 keeps your Node.js app running and auto-restarts on crash.

**Install PM2:**

```bash
npm install -g pm2
```

**Create an ecosystem config** (`web/ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: 'jobs-pipeline',
      script: './node_modules/.bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGc...',
        NODE_ENV: 'production',
      },
    },
  ],
};
```

**Start the app:**

```bash
cd web
npm run build
pm2 start ecosystem.config.js
```

**Monitor:**

```bash
pm2 logs jobs-pipeline  # View live logs
pm2 status              # Check running apps
```

### Option 4: Systemd Service (Linux)

For a systemd-managed service that starts on boot:

Create `/etc/systemd/system/jobs-pipeline.service`:

```ini
[Unit]
Description=Jobs Pipeline Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/jobs-pipeline/web
Environment="NODE_ENV=production"
Environment="NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
Environment="NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc..."
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable jobs-pipeline
sudo systemctl start jobs-pipeline
```

**Check status:**

```bash
sudo systemctl status jobs-pipeline
sudo journalctl -u jobs-pipeline -f  # View logs
```

### Option 5: Nginx Reverse Proxy

Set up Nginx to forward traffic to your Next.js app.

**Create `/etc/nginx/sites-available/jobs-pipeline`:**

```nginx
upstream jobs_pipeline {
  server localhost:3000;
}

server {
  listen 80;
  server_name jobs.example.com;

  location / {
    proxy_pass http://jobs_pipeline;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/jobs-pipeline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Add HTTPS** (via Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d jobs.example.com
```

---

## Environment Variables Summary

### Local Development (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://qhcqecodncwrpnlhullo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel (Dashboard → Settings → Environment Variables)

Same as above, plus any secrets you want isolated.

### Self-Hosted (via `.env` or command-line args)

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJ..."
npm start
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### Build Fails with Missing Dependencies

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Supabase Connection Errors

- Check `.env.local` has the correct URL and key
- Ensure your Supabase project is active (not paused)
- Verify the publishable key is for the `anon` role, not `service_role`

### CSS/Styling Not Loading

```bash
# Rebuild Tailwind CSS
npm run build
```

Tailwind v4 requires rebuilding. Ensure `postcss.config.mjs` exists and `@tailwindcss/postcss` is installed.

### Vercel Deployment Fails

```bash
# Test build locally first
npm run build
npm run start

# Check Vercel logs
vercel logs --follow
```

Common issues:
- Missing environment variables in Vercel dashboard
- Build script timeout (increase in Vercel project settings)
- Node.js version mismatch

---

## Summary

| Scenario | Command |
|---|---|
| **Local dev** | `cd web && npm install && npm run dev` |
| **Test production build** | `npm run build && npm start` |
| **Deploy to Vercel** | `vercel deploy --prod` |
| **Deploy to Docker** | `docker-compose up -d` |
| **Deploy with PM2** | `npm run build && pm2 start ecosystem.config.js` |
| **Deploy with Systemd** | Create service file, then `systemctl start jobs-pipeline` |

---

## Next Steps

- **Add a custom domain** to Vercel or your reverse proxy
- **Enable auto-deploys** via GitHub integration
- **Monitor** app performance with Vercel Analytics or your host's dashboards
- **Scale** by adding more Edge Functions or caching layers
- **Secure** with HTTPS/SSL (automatic on Vercel, via Certbot on self-hosted)
