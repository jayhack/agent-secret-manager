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

function secretField(secret, index, isOnly) {
  const present = secret.present;
  const required = secret.required === false || present ? "" : "required";
  const help = secret.help || secret.reason;
  const helpBlock = help
    ? `<p class="field-help">${escapeHtml(help)}</p>`
    : "";
  const presentNote = present
    ? `<p class="field-help field-help-soft">Already set. Leave blank to keep the existing value.</p>`
    : "";
  const placeholder = secret.placeholder || "Paste secret value";
  const autofocus = isOnly && !present ? "autofocus" : "";
  const labelText = secret.label || secret.name;

  return `
    <div class="field">
      <div class="field-head">
        <label for="secret-${index}">${escapeHtml(labelText)}</label>
        <code class="env-tag">${escapeHtml(secret.name)}</code>
      </div>
      ${helpBlock}
      ${presentNote}
      <div class="input-row">
        <input
          id="secret-${index}"
          name="secret_${index}"
          type="password"
          ${required}
          ${autofocus}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="${escapeHtml(placeholder)}"
        />
        <button type="button" class="reveal" data-toggle="secret-${index}" aria-label="Show or hide ${escapeHtml(secret.name)}">
          <svg class="eye eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg class="eye eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.4 4.1"/><path d="M6.2 7.7C3.7 9.5 2.5 12 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.4 4.5-1.1"/><path d="M9.6 10.1A3 3 0 0 0 12 15a3 3 0 0 0 2.5-1.4"/></svg>
        </button>
      </div>
    </div>
  `;
}

const FAVICON_DATA_URI = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0%" stop-color="#6f5cff"/>` +
  `<stop offset="100%" stop-color="#b48bff"/>` +
  `</linearGradient></defs>` +
  `<path d="M10 14V10a6 6 0 0 1 12 0v4" fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>` +
  `<rect x="6" y="14" width="20" height="14" rx="3.5" fill="url(#g)"/>` +
  `<circle cx="16" cy="20" r="2.2" fill="#ffffff"/>` +
  `<path d="M16 20v3.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>` +
  `</svg>`
);

const FAVICON_LINK = `<link rel="icon" type="image/svg+xml" href="${FAVICON_DATA_URI}" />`;

const SHARED_BASE_STYLES = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    min-height: 100vh;
    color: #0f1020;
    font: 16px/1.55 "Inter", "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif;
    background: #fbfbff;
    background-image:
      radial-gradient(ellipse 70% 55% at 18% 0%, rgba(124, 92, 255, 0.18), transparent 65%),
      radial-gradient(ellipse 70% 55% at 92% 8%, rgba(80, 130, 255, 0.16), transparent 60%),
      radial-gradient(ellipse 80% 70% at 88% 100%, rgba(155, 110, 255, 0.16), transparent 65%),
      radial-gradient(ellipse 80% 65% at 8% 95%, rgba(110, 165, 255, 0.14), transparent 65%),
      linear-gradient(180deg, #ffffff 0%, #fafaff 60%, #f5f5ff 100%);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #0f1020;
    text-decoration: none;
    font-weight: 600;
    letter-spacing: -0.005em;
  }

  .logo-mark {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 4px 14px rgba(111, 92, 255, 0.28));
  }

  .logo-mark svg { display: block; width: 100%; height: 100%; }
`;

export function renderRequestPage({ spec, token, existingValues, storage, error = "" }) {
  const secrets = spec.secrets.map((secret) => ({
    ...secret,
    present: existingValues.has(secret.name) && existingValues.get(secret.name) !== ""
  }));
  const isOnly = secrets.length === 1;
  const action = `/submit?token=${encodeURIComponent(token)}`;
  const secretNames = secrets.map((secret) => secret.name);
  const titleLead = isOnly ? secretNames[0] : `${secretNames.length} secrets`;
  const pageTitle = [titleLead, spec.title].filter(Boolean).join(" · ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(pageTitle)}</title>
  ${FAVICON_LINK}
  <link rel="preconnect" href="https://rsms.me" crossorigin>
  <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
  <style>
    ${SHARED_BASE_STYLES}

    main {
      width: min(540px, 100% - 32px);
      margin: 0 auto;
      padding: 56px 0 80px;
    }

    .topbar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 36px;
    }

    .card {
      position: relative;
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: saturate(140%) blur(18px);
      -webkit-backdrop-filter: saturate(140%) blur(18px);
      border: 1px solid rgba(15, 16, 32, 0.06);
      border-radius: 18px;
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.65) inset,
        0 1px 2px rgba(15, 16, 32, 0.04),
        0 18px 48px rgba(76, 53, 180, 0.10),
        0 40px 90px rgba(76, 53, 180, 0.06);
      padding: 36px 36px 32px;
    }

    .eyebrow {
      margin: 0 0 12px;
      color: #6f5cff;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 2rem;
      line-height: 1.1;
      font-weight: 700;
      letter-spacing: -0.022em;
      color: #0f1020;
    }

    .lead {
      margin: 0 0 28px;
      color: #5a5a72;
      font-size: 0.985rem;
      line-height: 1.5;
    }

    .field + .field {
      margin-top: 22px;
    }

    .field-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    label {
      display: inline-block;
      font-weight: 600;
      font-size: 0.95rem;
      color: #0f1020;
      letter-spacing: -0.005em;
    }

    .env-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      background: linear-gradient(135deg, rgba(111, 92, 255, 0.10), rgba(80, 130, 255, 0.10));
      border: 1px solid rgba(111, 92, 255, 0.18);
      color: #4a3ee0;
      font: 500 0.78rem/1.4 "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
      letter-spacing: 0;
    }

    .field-help {
      margin: 0 0 12px;
      color: #5a5a72;
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .field-help-soft {
      color: #8b8aa0;
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
      height: 52px;
      padding: 0 50px 0 16px;
      border-radius: 12px;
      border: 1.5px solid rgba(15, 16, 32, 0.10);
      background: rgba(255, 255, 255, 0.95);
      color: #0f1020;
      font: 500 0.96rem/1.4 "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
      letter-spacing: 0;
      transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
      box-shadow: 0 1px 1px rgba(15, 16, 32, 0.02);
    }

    input::placeholder {
      color: #a8a7bc;
      font-weight: 400;
    }

    input:focus {
      outline: none;
      border-color: #6f5cff;
      background: white;
      box-shadow:
        0 0 0 4px rgba(111, 92, 255, 0.15),
        0 1px 1px rgba(15, 16, 32, 0.04);
    }

    .reveal {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      background: transparent;
      border: 0;
      border-radius: 8px;
      color: #8b8aa0;
      cursor: pointer;
      transition: color 140ms ease, background 140ms ease;
    }

    .reveal:hover {
      color: #4a3ee0;
      background: rgba(111, 92, 255, 0.08);
    }

    .reveal:focus-visible {
      outline: none;
      color: #4a3ee0;
      box-shadow: 0 0 0 3px rgba(111, 92, 255, 0.22);
    }

    .reveal .eye {
      width: 20px;
      height: 20px;
    }

    .reveal .eye-closed { display: none; }
    .reveal[data-shown="true"] .eye-open { display: none; }
    .reveal[data-shown="true"] .eye-closed { display: block; }

    .submit {
      margin-top: 24px;
      width: 100%;
      height: 52px;
      border: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, #6f5cff 0%, #7d5cff 50%, #9b6cff 100%);
      color: white;
      font: 600 0.98rem/1 "Inter", system-ui, sans-serif;
      letter-spacing: -0.005em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.25) inset,
        0 8px 22px rgba(111, 92, 255, 0.32),
        0 1px 2px rgba(15, 16, 32, 0.08);
      transition: transform 120ms ease, box-shadow 160ms ease, filter 140ms ease;
    }

    .submit:hover {
      transform: translateY(-1px);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.3) inset,
        0 12px 28px rgba(111, 92, 255, 0.38),
        0 2px 4px rgba(15, 16, 32, 0.10);
      filter: saturate(110%);
    }

    .submit:active {
      transform: translateY(0);
    }

    .submit:disabled {
      cursor: progress;
      opacity: 0.85;
      transform: none;
      box-shadow: 0 4px 14px rgba(111, 92, 255, 0.22);
    }

    .submit .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.25);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .error {
      margin: 0 0 22px;
      border: 1px solid rgba(220, 60, 60, 0.18);
      background: rgba(255, 232, 230, 0.7);
      color: #b32b1d;
      padding: 11px 14px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .details {
      margin-top: 28px;
      border-top: 1px solid rgba(15, 16, 32, 0.06);
      padding-top: 8px;
    }

    .details details {
      border-bottom: 1px solid rgba(15, 16, 32, 0.06);
    }

    .details details:last-child {
      border-bottom: 0;
    }

    .details summary {
      list-style: none;
      cursor: pointer;
      padding: 14px 0;
      font-size: 0.88rem;
      font-weight: 500;
      color: #4a4a63;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      letter-spacing: -0.005em;
      user-select: none;
    }

    .details summary::-webkit-details-marker { display: none; }

    .details summary .chev {
      width: 14px;
      height: 14px;
      transition: transform 180ms ease;
      color: #8b8aa0;
    }

    .details details[open] summary .chev {
      transform: rotate(90deg);
    }

    .details summary:hover {
      color: #0f1020;
    }

    .details .body {
      padding: 0 0 16px;
      color: #5a5a72;
      font-size: 0.88rem;
      line-height: 1.55;
    }

    .details .body p {
      margin: 0 0 10px;
    }

    .paths {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: grid;
      gap: 6px;
    }

    .paths li {
      display: grid;
      grid-template-columns: 88px minmax(0, 1fr);
      gap: 10px;
      align-items: baseline;
    }

    .paths li strong {
      color: #4a4a63;
      font-weight: 500;
      font-size: 0.83rem;
    }

    .paths code {
      display: inline-block;
      max-width: 100%;
      overflow-wrap: anywhere;
      padding: 2px 6px;
      border-radius: 5px;
      background: rgba(15, 16, 32, 0.04);
      color: #4a4a63;
      font: 500 0.78rem/1.5 "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
    }

    .footer-note {
      margin: 28px auto 0;
      max-width: 540px;
      text-align: center;
      color: #8b8aa0;
      font-size: 0.78rem;
      letter-spacing: -0.005em;
    }

    /* Closing splash */
    .closing {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(251, 251, 255, 0.78);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
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
      padding: 28px 36px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(15, 16, 32, 0.06);
      box-shadow: 0 18px 48px rgba(76, 53, 180, 0.14);
      transform: translateY(8px);
      transition: transform 240ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
    }

    .closing[data-on="true"] .closing-card {
      transform: translateY(0);
    }

    .check {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: linear-gradient(135deg, #6f5cff 0%, #8a6cff 50%, #b48bff 100%);
      box-shadow: 0 6px 18px rgba(111, 92, 255, 0.35);
      display: grid;
      place-items: center;
      color: white;
    }

    .closing-text {
      font-weight: 600;
      letter-spacing: -0.005em;
      color: #0f1020;
    }

    .closing-sub {
      color: #6c6c85;
      font-size: 0.86rem;
    }

    @media (max-width: 520px) {
      .card { padding: 28px 22px 24px; border-radius: 16px; }
      h1 { font-size: 1.7rem; }
      .paths li { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <div class="topbar">
      <a class="logo" href="https://agent-secret-manager.com" target="_blank" rel="noopener">
        <span class="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-grad-req" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6f5cff"/>
                <stop offset="100%" stop-color="#b48bff"/>
              </linearGradient>
            </defs>
            <path d="M10 14V10a6 6 0 0 1 12 0v4" fill="none" stroke="url(#logo-grad-req)" stroke-width="3" stroke-linecap="round"/>
            <rect x="6" y="14" width="20" height="14" rx="3.5" fill="url(#logo-grad-req)"/>
            <circle cx="16" cy="20" r="2.2" fill="#ffffff"/>
            <path d="M16 20v3.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <span>agent-secret-manager</span>
      </a>
    </div>

    <article class="card">
      <p class="eyebrow">Secret request</p>
      <h1>${escapeHtml(spec.title)}</h1>
      <p class="lead">A local coding agent is asking for ${secrets.length === 1 ? "a secret" : "secrets"} without seeing the value. Paste below — your terminal only sees a presence check.</p>

      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}

      <form method="post" action="${action}" novalidate>
        ${secrets.map((secret, index) => secretField(secret, index, isOnly)).join("")}

        <button type="submit" class="submit">
          <span>Save and close</span>
          <span class="kbd">↵</span>
        </button>
      </form>

      <div class="details">
        <details>
          <summary>
            <span>Why the agent is asking</span>
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </summary>
          <div class="body">
            <p>${escapeHtml(spec.reason)}</p>
          </div>
        </details>
        <details>
          <summary>
            <span>What happens when you press Enter</span>
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </summary>
          <div class="body">
            <p>The value is saved to a local file on this machine. The terminal only receives a presence check — never the value.</p>
            <ul class="paths">
              <li><strong>Secret file</strong><code>${storageValue(storage?.envPath || spec.envFile)}</code></li>
              <li><strong>Example</strong><code>${storageValue(storage?.examplePath || spec.exampleFile)}</code></li>
              <li><strong>Metadata</strong><code>${storageValue(storage?.manifestPath)}</code></li>
            </ul>
          </div>
        </details>
      </div>
    </article>

    <p class="footer-note">Local server · ${escapeHtml(secrets.map((s) => s.name).join(", "))}</p>
  </main>

  <div class="closing" id="closing" aria-hidden="true">
    <div class="closing-card">
      <div class="check" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
      </div>
      <div class="closing-text">Closing this tab — your secret is saved.</div>
      <div class="closing-sub">You can close this window if it doesn't close on its own.</div>
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

export function renderSuccessPage({ spec, savedNames, storage }) {
  const names = savedNames.length ? savedNames : spec.secrets.map((secret) => secret.name);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="robots" content="noindex" />
  <title>Saved</title>
  ${FAVICON_LINK}
  <link rel="preconnect" href="https://rsms.me" crossorigin>
  <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
  <style>
    ${SHARED_BASE_STYLES}

    body {
      display: grid;
      place-items: center;
      padding: 24px;
    }

    main {
      width: min(440px, 100%);
      text-align: center;
    }

    .check {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      margin: 0 auto 22px;
      background: linear-gradient(135deg, #6f5cff 0%, #8a6cff 50%, #b48bff 100%);
      box-shadow: 0 12px 36px rgba(111, 92, 255, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.4);
      display: grid;
      place-items: center;
      color: white;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 1.65rem;
      font-weight: 700;
      letter-spacing: -0.022em;
      color: #0f1020;
    }

    .lead {
      margin: 0 0 18px;
      color: #5a5a72;
      font-size: 0.96rem;
      line-height: 1.5;
    }

    .names {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin: 0 0 16px;
    }

    .names code {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 7px;
      background: linear-gradient(135deg, rgba(111, 92, 255, 0.10), rgba(80, 130, 255, 0.10));
      border: 1px solid rgba(111, 92, 255, 0.18);
      color: #4a3ee0;
      font: 500 0.82rem/1.4 "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
    }

    .path {
      margin: 14px auto 0;
      max-width: 100%;
      color: #8b8aa0;
      font: 500 0.78rem/1.5 "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }
  </style>
</head>
<body>
  <main>
    <div class="check" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
    </div>
    <h1>Closing this tab — your secret is saved.</h1>
    <p class="lead">${names.length === 1 ? "Saved" : "Saved"}:</p>
    <p class="names">${names.map((name) => `<code>${escapeHtml(name)}</code>`).join(" ")}</p>
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
