// The two documents as pure, printable A4 markup.
//
// Deliberately free of Tailwind utility classes and of any hook: all styling
// lives in the .cv-* rules in globals.css, which are shared by the on-screen
// preview and the printed page. That keeps these renderable in isolation — the
// PDF output can be verified without booting the whole app.

import type { Anschreiben, Lebenslauf } from "@/lib/cv-types";

function dateRange(von?: string, bis?: string) {
  if (von && bis) return `${von} – ${bis}`;
  return von ?? bis ?? "";
}

export function LebenslaufSheet({ cv }: { cv: Lebenslauf }) {
  const p = cv.persoenlicheDaten;
  const personal: [string, string | undefined][] = [
    ["Adresse", p.adresse],
    ["Telefon", p.telefon],
    ["E-Mail", p.email],
    ["Geburtsdatum", p.geburtsdatum],
    ["Geburtsort", p.geburtsort],
    ["Staatsangehörigkeit", p.staatsangehoerigkeit],
  ];

  return (
    <div className="cv-sheet" data-cv-sheet="lebenslauf">
      <h1>Lebenslauf</h1>

      <div className="cv-section-title">Persönliche Daten</div>
      <div className="cv-row">
        <div className="cv-row-label">Name</div>
        <div className="cv-entry-title">{p.name}</div>
      </div>
      {personal.map(([label, value]) =>
        value ? (
          <div className="cv-row" key={label}>
            <div className="cv-row-label">{label}</div>
            <div>{value}</div>
          </div>
        ) : null,
      )}

      {cv.abschnitte.map((section) => (
        <div key={section.titel}>
          <div className="cv-section-title">{section.titel}</div>
          {section.eintraege.map((e, i) => (
            <div className="cv-row" key={i}>
              <div className="cv-row-label">{dateRange(e.von, e.bis)}</div>
              <div>
                <div className="cv-entry-title">{e.titel}</div>
                {(e.organisation || e.ort) && (
                  <div>{[e.organisation, e.ort].filter(Boolean).join(", ")}</div>
                )}
                {e.details.length > 0 && (
                  <ul className="cv-details">
                    {e.details.map((d, j) => (
                      <li key={j}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {(cv.ort || cv.datum) && (
        <>
          <div style={{ marginTop: "14mm" }}>
            {[cv.ort, cv.datum].filter(Boolean).join(", ")}
          </div>
          <div className="cv-signature-gap" />
          <div>{p.name}</div>
        </>
      )}
    </div>
  );
}

export function AnschreibenSheet({ a }: { a: Anschreiben }) {
  return (
    <div className="cv-sheet" data-cv-sheet="anschreiben">
      {/* Absender */}
      <div style={{ fontSize: "9pt", color: "#3f3f46" }}>
        {[a.absender.name, ...a.absender.zeilen].filter(Boolean).join(" · ")}
      </div>

      {/* Anschriftenfeld */}
      <div className="cv-letter-address" style={{ marginTop: "12mm" }}>
        {a.empfaenger.zeilen.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {(a.ort || a.datum) && (
        <div className="cv-letter-date">
          {[a.ort, a.datum].filter(Boolean).join(", ")}
        </div>
      )}

      {a.betreff && <div className="cv-letter-subject">{a.betreff}</div>}

      <div className="cv-letter-body">
        <p>{a.anrede}</p>
        {a.absaetze.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div style={{ marginTop: "6mm" }}>{a.gruss}</div>
      <div className="cv-signature-gap" />
      <div>{a.unterschrift}</div>
    </div>
  );
}
