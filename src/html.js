function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function storageValue(value) {
  return value ? escapeHtml(value) : "Not configured";
}

function isRequired(secret) {
  return secret.required === true;
}

const PAGE_TITLE = ".env request";

const TIKI_MARK = `
  <svg class="tiki-mark" viewBox="0 0 64 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="8" y="4" width="48" height="66" rx="9" stroke="currentColor" stroke-width="3"/>
    <path d="M13 27 L32 17 L51 27" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="23" cy="40" r="7" stroke="currentColor" stroke-width="2.6"/>
    <circle cx="23" cy="40" r="2.4" fill="currentColor"/>
    <circle cx="41" cy="40" r="7" stroke="currentColor" stroke-width="2.6"/>
    <circle cx="41" cy="40" r="2.4" fill="currentColor"/>
    <path d="M32 44 L27 57 L37 57 Z" fill="currentColor"/>
    <rect x="18" y="60" width="28" height="9" rx="2" stroke="currentColor" stroke-width="2.4"/>
    <path d="M27 60 L27 69 M32 60 L32 69 M37 60 L37 69" stroke="currentColor" stroke-width="1.6"/>
    <path d="M16 78 H48 M16 86 H48 M16 94 H48" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  </svg>
`;

function secretField(secret, index, isOnly) {
  const present = secret.present;
  const required = isRequired(secret) && !present ? "required" : "";
  const hidden = secret.hidden !== false;
  const inputType = hidden ? "password" : "text";
  const autofillAttrs = hidden
    ? `data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"`
    : "";
  const placeholder = secret.placeholder || (hidden ? "Paste value or leave blank" : "Enter value or leave blank");
  const autofocus = isOnly && !present ? "autofocus" : "";
  const status = present ? "Configured" : isRequired(secret) ? "Required" : "Optional";
  const statusClass = present ? " field-status-present" : isRequired(secret) ? " field-status-required" : "";
  const revealButton = hidden
    ? `<button type="button" class="reveal" data-toggle="secret-${index}" aria-label="Show or hide ${escapeHtml(secret.name)}">
          <svg class="eye eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg class="eye eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.4 4.1"/><path d="M6.2 7.7C3.7 9.5 2.5 12 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.4 4.5-1.1"/><path d="M9.6 10.1A3 3 0 0 0 12 15a3 3 0 0 0 2.5-1.4"/></svg>
        </button>`
    : "";
  const presentNote = present
    ? `<p class="field-help">Leave blank to keep the existing value.</p>`
    : "";

  return `
    <div class="field">
      <label class="field-var" for="secret-${index}">
        <code class="env-tag">${escapeHtml(secret.name)}</code>
        <span class="field-status${statusClass}">${status}</span>
      </label>
      <div class="field-control">
        <div class="input-row${hidden ? "" : " input-row-plain"}">
          <input
            id="secret-${index}"
            name="secret_${index}"
            type="${inputType}"
            ${required}
            ${autofocus}
            autocomplete="off"
            ${autofillAttrs}
            autocapitalize="off"
            spellcheck="false"
            placeholder="${escapeHtml(placeholder)}"
          />
          ${revealButton}
        </div>
        ${presentNote}
      </div>
    </div>
  `;
}

function detailSecretRows(secrets) {
  return secrets.map((secret) => {
    const help = secret.help || secret.reason || "No extra note provided.";
    const status = secret.present ? "configured" : isRequired(secret) ? "required" : "optional";
    return `
      <li>
        <div>
          <code>${escapeHtml(secret.name)}</code>
          <span>${escapeHtml(status)}</span>
        </div>
        <p>${escapeHtml(help)}</p>
      </li>
    `;
  }).join("");
}

const FAVICON_DATA_URI = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" rx="6" fill="#0B0712"/>` +
  `<circle cx="25" cy="5" r="16" fill="#FF6A2C" opacity="0.34"/>` +
  `<path d="M9 9h14v14H9z" rx="2" fill="none" stroke="#16E6C4" stroke-width="1.8"/>` +
  `<path d="M11 15l5-3 5 3" stroke="#16E6C4" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="13.5" cy="17" r="1.6" fill="#16E6C4"/>` +
  `<circle cx="18.5" cy="17" r="1.6" fill="#16E6C4"/>` +
  `<path d="M16 18.5l-2 3h4z" fill="#16E6C4"/>` +
  `<path d="M12 23h8" stroke="#16E6C4" stroke-width="1.4" stroke-linecap="round"/>` +
  `</svg>`
);

const FAVICON_LINK = `<link rel="icon" type="image/svg+xml" href="${FAVICON_DATA_URI}" />`;

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
`;

const SHARED_BASE_STYLES = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :root {
    --obsidian: #0b0712;
    --basalt: #17111f;
    --basalt-2: #20172a;
    --teal: #16e6c4;
    --solar: #ffc24a;
    --ember: #ff6a2c;
    --hibiscus: #ff2e76;
    --orchid: #7a2be0;
    --moonlight: #f6ecdd;
    --muted: rgba(246, 236, 221, 0.68);
    --soft: rgba(246, 236, 221, 0.42);
    --hairline: rgba(246, 236, 221, 0.12);
    --hairline-strong: rgba(246, 236, 221, 0.2);
    --teal-soft: rgba(22, 230, 196, 0.14);
    --teal-ring: rgba(22, 230, 196, 0.25);
    --sunset: linear-gradient(180deg, #ffc24a 0%, #ff6a2c 30%, #ff2e76 56%, #7a2be0 80%, #0b0712 100%);
    --acid-card: linear-gradient(155deg, #0b0712 0%, #7a2be0 26%, #ff2e76 48%, #ff6a2c 66%, #ffc24a 84%, #16e6c4 100%);
    --lava-panel: linear-gradient(180deg, #17111f 0%, #0b0712 64%, #3a0f12 100%);
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    min-height: 100vh;
    color: var(--moonlight);
    font: 16px/1.55 "Inter", "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif;
    background:
      radial-gradient(circle at 86% -8%, rgba(255, 194, 74, 0.18), transparent 28rem),
      radial-gradient(circle at 14% -6%, rgba(122, 43, 224, 0.24), transparent 30rem),
      radial-gradient(circle at 68% 40%, rgba(255, 46, 118, 0.1), transparent 34rem),
      var(--obsidian);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image: repeating-linear-gradient(0deg, transparent 0 5px, rgba(246, 236, 221, 0.035) 5px 6px);
    opacity: 0.7;
  }

  .display {
    font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .mono {
    font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: var(--moonlight);
    text-decoration: none;
    font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .logo-mark {
    width: 30px;
    height: 46px;
    display: grid;
    place-items: center;
    color: var(--teal);
    filter: drop-shadow(0 0 10px rgba(22, 230, 196, 0.55));
  }

  .logo-mark svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .acid-rings {
    background-image: repeating-radial-gradient(
      circle at 50% 50%,
      transparent 0 17px,
      rgba(122, 43, 224, 0.5) 17px 18px,
      transparent 18px 34px,
      rgba(255, 46, 118, 0.4) 34px 35px,
      transparent 35px 52px,
      rgba(255, 106, 44, 0.35) 52px 53px,
      transparent 53px
    );
  }

  .sun-disc {
    background: radial-gradient(circle at 50% 50%, #ffc24a 0%, #ff6a2c 34%, #ff2e76 62%, rgba(122, 43, 224, 0) 76%);
  }

  .sunburst {
    background: repeating-conic-gradient(
      from 0deg at 50% 50%,
      rgba(255, 194, 74, 0.26) 0deg 0.55deg,
      transparent 0.55deg 5deg
    );
    -webkit-mask: radial-gradient(circle at 50% 50%, #000 0 46%, transparent 62%);
    mask: radial-gradient(circle at 50% 50%, #000 0 46%, transparent 62%);
  }

  .notch-row {
    height: 9px;
    background: var(--teal);
    opacity: 0.82;
    -webkit-mask: repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 11px);
    mask: repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 11px);
  }
`;

export function renderRequestPage({ spec, token, existingValues, storage, error = "" }) {
  const secrets = spec.secrets.map((secret) => ({
    ...secret,
    present: existingValues.has(secret.name) && existingValues.get(secret.name) !== ""
  }));
  const isOnly = secrets.length === 1;
  const action = `/submit?token=${encodeURIComponent(token)}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="robots" content="noindex" />
  <title>${PAGE_TITLE}</title>
  ${FAVICON_LINK}
  ${FONT_LINKS}
  <style>
    ${SHARED_BASE_STYLES}

    main {
      position: relative;
      z-index: 1;
      width: min(860px, 100% - 32px);
      margin: 0 auto;
      padding: 34px 0 64px;
    }

    .backdrop-art {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }

    .backdrop-art .sun-disc {
      position: absolute;
      right: -11rem;
      top: -13rem;
      width: 34rem;
      height: 34rem;
      opacity: 0.62;
    }

    .backdrop-art .sunburst {
      position: absolute;
      right: -14rem;
      top: -16rem;
      width: 42rem;
      height: 42rem;
      opacity: 0.5;
    }

    .backdrop-art .acid-rings {
      position: absolute;
      left: -19rem;
      top: 3rem;
      width: 40rem;
      height: 40rem;
      opacity: 0.22;
    }

    .card {
      position: relative;
      overflow: hidden;
      background: var(--basalt);
      border: 1px solid var(--hairline);
      border-top-color: rgba(22, 230, 196, 0.55);
      border-radius: 6px;
      padding: 22px 26px 26px;
      box-shadow: 0 0 0 1px rgba(22, 230, 196, 0.03), 0 24px 80px rgba(0, 0, 0, 0.34);
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 66px;
      background: var(--lava-panel);
      opacity: 0.55;
      pointer-events: none;
    }

    .card > * {
      position: relative;
      z-index: 1;
    }

    .request-summary {
      margin: 0 0 16px;
    }

    .summary-title {
      margin: 0;
      color: var(--moonlight);
      font: 700 0.98rem/1.35 "Space Grotesk", "Inter", system-ui, sans-serif;
      letter-spacing: -0.01em;
    }

    .secrets-form {
      border: 1px solid var(--hairline);
      border-radius: 6px;
      background: rgba(11, 7, 18, 0.3);
      overflow: hidden;
    }

    .field {
      display: grid;
      grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
    }

    .field + .field {
      border-top: 1px solid var(--hairline);
    }

    .field-control {
      min-width: 0;
    }

    .field-var {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      min-width: 0;
    }

    .field-status {
      flex: 0 0 auto;
      color: var(--soft);
      font: 700 0.58rem/1.3 "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .field-status-required {
      border-color: rgba(255, 194, 74, 0.35);
      color: var(--solar);
    }

    .field-status-present {
      border-color: rgba(22, 230, 196, 0.4);
      color: var(--teal);
    }

    .env-tag {
      display: inline-block;
      min-width: 0;
      overflow-wrap: normal;
      white-space: nowrap;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--moonlight);
      font: 700 0.82rem/1.45 "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: 0;
    }

    .field-help {
      margin: 6px 0 0;
      color: var(--soft);
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .input-row {
      position: relative;
      display: flex;
      align-items: stretch;
    }

    input[type="password"],
    input[type="text"] {
      flex: 1;
      width: 100%;
      min-width: 0;
      height: 40px;
      padding: 0 50px 0 14px;
      border-radius: 6px;
      border: 1px solid rgba(246, 236, 221, 0.14);
      background: var(--basalt-2);
      color: var(--moonlight);
      font: 700 0.94rem/1.4 "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
      letter-spacing: 0;
      transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
    }

    input::placeholder {
      color: rgba(246, 236, 221, 0.36);
      font-weight: 500;
    }

    input:focus {
      outline: none;
      border-color: var(--teal);
      background: #1b1424;
      box-shadow: 0 0 0 3px var(--teal-ring), 0 0 28px rgba(22, 230, 196, 0.16);
    }

    .input-row-plain input {
      padding-right: 14px;
    }

    .reveal {
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      background: transparent;
      border: 0;
      border-radius: 6px;
      color: rgba(246, 236, 221, 0.48);
      cursor: pointer;
      transition: color 140ms ease, background 140ms ease, box-shadow 140ms ease;
    }

    .reveal:hover {
      color: var(--teal);
      background: rgba(22, 230, 196, 0.08);
    }

    .reveal:focus-visible {
      outline: none;
      color: var(--teal);
      box-shadow: 0 0 0 3px var(--teal-ring);
    }

    .reveal .eye {
      width: 20px;
      height: 20px;
    }

    .reveal .eye-closed { display: none; }
    .reveal[data-shown="true"] .eye-open { display: none; }
    .reveal[data-shown="true"] .eye-closed { display: block; }

    .submit {
      margin-top: 0;
      width: 100%;
      height: 52px;
      border: 0;
      border-top: 1px solid rgba(22, 230, 196, 0.3);
      border-radius: 0;
      background: var(--teal);
      color: var(--obsidian);
      font: 700 0.94rem/1 "Space Grotesk", "Inter", system-ui, sans-serif;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 0 26px rgba(22, 230, 196, 0.4);
      transition: transform 120ms ease, box-shadow 160ms ease, filter 140ms ease;
    }

    .submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 34px rgba(22, 230, 196, 0.62);
      filter: saturate(108%);
    }

    .submit:active {
      transform: translateY(0);
    }

    .submit:disabled {
      cursor: progress;
      opacity: 0.85;
      transform: none;
      box-shadow: 0 0 18px rgba(22, 230, 196, 0.28);
    }

    .submit .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: 6px;
      background: rgba(11, 7, 18, 0.12);
      border: 1px solid rgba(11, 7, 18, 0.18);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .error {
      margin: 0 0 18px;
      border: 1px solid rgba(255, 46, 118, 0.38);
      background: rgba(255, 46, 118, 0.12);
      color: var(--moonlight);
      padding: 11px 14px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .details {
      margin-top: 20px;
      border: 1px solid var(--hairline);
      border-radius: 6px;
      background: rgba(11, 7, 18, 0.28);
      overflow: hidden;
    }

    .details summary {
      list-style: none;
      cursor: pointer;
      padding: 15px 16px;
      font: 700 0.98rem/1.35 "Space Grotesk", "Inter", system-ui, sans-serif;
      color: var(--moonlight);
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      user-select: none;
    }

    .details summary::-webkit-details-marker { display: none; }

    .details summary .chev {
      width: 14px;
      height: 14px;
      transition: transform 180ms ease;
      color: var(--muted);
    }

    .details details[open] summary .chev {
      transform: rotate(90deg);
    }

    .details .body {
      border-top: 1px solid var(--hairline);
      padding: 16px;
      color: var(--muted);
      font-size: 0.88rem;
      line-height: 1.55;
    }

    .details .body h2 {
      margin: 0 0 6px;
      color: var(--moonlight);
      font: 700 0.86rem/1.4 "Space Grotesk", "Inter", system-ui, sans-serif;
      letter-spacing: -0.01em;
    }

    .details .body p {
      margin: 0 0 14px;
    }

    .detail-section + .detail-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--hairline);
    }

    .secret-notes,
    .paths {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }

    .secret-notes li {
      display: grid;
      gap: 4px;
      padding: 10px;
      border-radius: 6px;
      background: rgba(246, 236, 221, 0.04);
    }

    .secret-notes div {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .secret-notes span {
      color: var(--soft);
      font: 700 0.62rem/1.4 "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .secret-notes p {
      margin: 0;
    }

    .paths li {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr);
      gap: 10px;
      align-items: baseline;
    }

    .paths li strong {
      color: var(--moonlight);
      font-weight: 700;
      font-size: 0.83rem;
    }

    code,
    .paths code {
      display: inline-block;
      max-width: 100%;
      overflow-wrap: anywhere;
      padding: 2px 6px;
      border-radius: 5px;
      background: rgba(22, 230, 196, 0.08);
      border: 1px solid rgba(22, 230, 196, 0.18);
      color: var(--teal);
      font: 700 0.78rem/1.5 "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
      letter-spacing: 0;
    }

    .footer-note {
      margin: 24px auto 0;
      max-width: 620px;
      text-align: center;
      color: rgba(246, 236, 221, 0.46);
      font: 700 0.68rem/1.5 "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    .closing {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(11, 7, 18, 0.84);
      opacity: 0;
      pointer-events: none;
      transition: opacity 220ms ease;
      z-index: 100;
    }

    .closing[data-on="true"] {
      opacity: 1;
      pointer-events: auto;
    }

    .closing-card {
      display: grid;
      place-items: center;
      gap: 14px;
      max-width: min(360px, 100% - 40px);
      padding: 28px 30px;
      border-radius: 6px;
      background: var(--basalt);
      border: 1px solid var(--hairline);
      border-top-color: rgba(22, 230, 196, 0.55);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
      transform: translateY(8px);
      transition: transform 240ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
      text-align: center;
    }

    .closing[data-on="true"] .closing-card {
      transform: translateY(0);
    }

    .check {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: var(--teal);
      box-shadow: 0 0 26px rgba(22, 230, 196, 0.4);
      display: grid;
      place-items: center;
      color: var(--obsidian);
    }

    .closing-text {
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--moonlight);
    }

    .closing-sub {
      color: var(--muted);
      font-size: 0.86rem;
    }

    @media (max-width: 720px) {
      .field { grid-template-columns: 1fr; gap: 10px; }
    }

    @media (max-width: 460px) {
      main { width: min(100% - 24px, 860px); padding-top: 22px; }
      .card { padding: 24px 18px; }
      .field { padding: 16px; }
      .field-help { flex-basis: 100%; }
      .paths li { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="backdrop-art" aria-hidden="true">
    <div class="sun-disc"></div>
    <div class="sunburst"></div>
    <div class="acid-rings"></div>
  </div>

  <main>
    <article class="card">
      <div class="request-summary">
        <p class="summary-title">Secrets requested by agent</p>
      </div>

      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}

      <form class="secrets-form" method="post" action="${action}" novalidate>
        ${secrets.map((secret, index) => secretField(secret, index, isOnly)).join("")}

        <button type="submit" class="submit">
          <span>Save and close</span>
          <span class="kbd">Enter</span>
        </button>
      </form>

      <div class="details">
        <details>
          <summary>
            <span>About this request</span>
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </summary>
          <div class="body">
            <section class="detail-section">
              <h2>Why the agent is asking</h2>
              <p>${escapeHtml(spec.reason)}</p>
            </section>
            <section class="detail-section">
              <h2>Requested values</h2>
              <ul class="secret-notes">
                ${detailSecretRows(secrets)}
              </ul>
            </section>
            <section class="detail-section">
              <h2>What happens when you save</h2>
              <p>Values you enter are saved to a local file on this machine. Blank optional fields are skipped. The terminal receives names and presence state, never secret values.</p>
              <ul class="paths">
                <li><strong>Secret file</strong><code>${storageValue(storage?.envPath || spec.envFile)}</code></li>
                <li><strong>Example</strong><code>${storageValue(storage?.examplePath || spec.exampleFile)}</code></li>
                <li><strong>Metadata</strong><code>${storageValue(storage?.manifestPath)}</code></li>
              </ul>
            </section>
          </div>
        </details>
      </div>
    </article>
  </main>

  <div class="closing" id="closing" aria-hidden="true">
    <div class="closing-card">
      <div class="check" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
      </div>
      <div class="closing-text">Closing this tab.</div>
      <div class="closing-sub">Submitted values were saved. Blank fields were skipped.</div>
    </div>
  </div>

  <script>
    const form = document.querySelector("form");
    const submitButton = form.querySelector('button[type="submit"]');
    const closing = document.getElementById("closing");

    for (const button of document.querySelectorAll("[data-toggle]")) {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.toggle);
        const next = input.type === "password" ? "text" : "password";
        input.type = next;
        button.dataset.shown = next === "text" ? "true" : "false";
      });
    }

    for (const input of form.querySelectorAll("input")) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          form.requestSubmit();
        }
      });
    }

    function showClosing() {
      closing.dataset.on = "true";
      closing.setAttribute("aria-hidden", "false");
    }

    function hideClosing() {
      closing.dataset.on = "false";
      closing.setAttribute("aria-hidden", "true");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submitButton.disabled = true;
      showClosing();

      try {
        const body = new URLSearchParams(new FormData(form));
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json" },
          body
        });

        if (!response.ok) {
          let message = "Could not save secret. Please try again.";
          try {
            const data = await response.json();
            if (data && typeof data.error === "string") message = data.error;
          } catch (_) {}
          submitButton.disabled = false;
          hideClosing();
          alert(message);
          return;
        }

        setTimeout(() => {
          window.open("", "_self");
          window.close();
        }, 900);
      } catch (error) {
        submitButton.disabled = false;
        hideClosing();
        alert(error && error.message ? error.message : "Network error.");
      }
    });
  </script>
</body>
</html>`;
}

function namesLine(title, names, className = "") {
  if (!names.length) {
    return "";
  }

  return `
    <div class="names-group ${className}">
      <p>${escapeHtml(title)}</p>
      <div class="names">${names.map((name) => `<code>${escapeHtml(name)}</code>`).join(" ")}</div>
    </div>
  `;
}

export function renderSuccessPage({ spec, savedNames = [], keptNames = [], skippedNames = [], storage }) {
  const saved = savedNames;
  const kept = keptNames;
  const skipped = skippedNames;
  const lead = saved.length
    ? "Submitted values were saved locally. Blank fields were skipped."
    : kept.length
      ? "No new values were entered. Existing configured values were kept."
      : "No new values were entered. Blank fields were skipped.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="robots" content="noindex" />
  <title>${PAGE_TITLE}</title>
  ${FAVICON_LINK}
  ${FONT_LINKS}
  <style>
    ${SHARED_BASE_STYLES}

    body {
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .success-art {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .success-art .sun-disc {
      position: absolute;
      right: -12rem;
      top: -14rem;
      width: 35rem;
      height: 35rem;
      opacity: 0.62;
    }

    .success-art .acid-rings {
      position: absolute;
      left: -20rem;
      bottom: -13rem;
      width: 42rem;
      height: 42rem;
      opacity: 0.18;
    }

    main {
      position: relative;
      z-index: 1;
      width: min(460px, 100%);
      text-align: center;
      background: var(--basalt);
      border: 1px solid var(--hairline);
      border-top-color: rgba(22, 230, 196, 0.55);
      border-radius: 6px;
      padding: 32px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
    }

    .logo-mark {
      width: 38px;
      height: 60px;
      margin: 0 auto 16px;
    }

    .check {
      width: 46px;
      height: 46px;
      border-radius: 999px;
      margin: 0 auto 18px;
      background: var(--teal);
      box-shadow: 0 0 26px rgba(22, 230, 196, 0.4);
      display: grid;
      place-items: center;
      color: var(--obsidian);
    }

    h1 {
      margin: 0 0 10px;
      font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--moonlight);
    }

    .lead {
      margin: 0 0 18px;
      color: var(--muted);
      font-size: 0.96rem;
      line-height: 1.5;
    }

    .notch-row {
      margin: 0 0 18px;
    }

    .names-group {
      margin-top: 14px;
    }

    .names-group p {
      margin: 0 0 8px;
      color: var(--soft);
      font: 700 0.64rem/1.4 "JetBrains Mono", ui-monospace, monospace;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .names {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin: 0;
    }

    .names-group-skipped code {
      color: var(--solar);
      border-color: rgba(255, 194, 74, 0.24);
      background: rgba(255, 194, 74, 0.08);
    }

    code {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 5px;
      background: rgba(22, 230, 196, 0.08);
      border: 1px solid rgba(22, 230, 196, 0.18);
      color: var(--teal);
      font: 700 0.78rem/1.45 "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
    }

    .path {
      margin: 18px auto 0;
      max-width: 100%;
      color: rgba(246, 236, 221, 0.48);
      font: 700 0.68rem/1.5 "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
      letter-spacing: 0.08em;
      overflow-wrap: anywhere;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="success-art" aria-hidden="true">
    <div class="sun-disc"></div>
    <div class="acid-rings"></div>
  </div>

  <main>
    <span class="logo-mark">${TIKI_MARK}</span>
    <div class="check" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
    </div>
    <h1>Closing this tab.</h1>
    <p class="lead">${lead}</p>
    <div class="notch-row" aria-hidden="true"></div>
    ${namesLine("Saved", saved)}
    ${namesLine("Kept existing", kept)}
    ${namesLine("Skipped", skipped, "names-group-skipped")}
    <p class="path">${storageValue(storage?.envPath || spec.envFile)}</p>
  </main>

  <script>
    setTimeout(() => {
      window.open("", "_self");
      window.close();
    }, 900);
  </script>
</body>
</html>`;
}
