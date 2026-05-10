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

function secretField(secret, index) {
  const existing = secret.present
    ? `<p class="field-note">Already set. Leave blank to keep the existing value.</p>`
    : "";
  const required = secret.required === false || secret.present ? "" : "required";
  const help = secret.help || secret.reason;
  const helpBlock = help
    ? `<p class="field-note"><span>Agent note</span>${escapeHtml(help)}</p>`
    : "";
  const placeholder = secret.placeholder || "Paste secret value";

  return `
    <section class="secret-row">
      <div class="secret-copy">
        <p class="eyebrow">Requested secret</p>
        <label for="secret-${index}">${escapeHtml(secret.label || secret.name)}</label>
        <code>${escapeHtml(secret.name)}</code>
        ${helpBlock}
        ${existing}
      </div>
      <div class="input-wrap">
        <input id="secret-${index}" name="secret_${index}" type="password" ${required} autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${escapeHtml(placeholder)}" />
        <button type="button" class="ghost" data-toggle="secret-${index}" aria-label="Show or hide ${escapeHtml(secret.name)}">Show</button>
      </div>
    </section>
  `;
}

export function renderRequestPage({ spec, token, existingValues, storage, error = "" }) {
  const secrets = spec.secrets.map((secret) => ({
    ...secret,
    present: existingValues.has(secret.name) && existingValues.get(secret.name) !== ""
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(spec.title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f4ee;
      --surface: #fffdf8;
      --surface-strong: #ffffff;
      --ink: #141413;
      --muted: #68655e;
      --subtle: #928e84;
      --line: #ded8cb;
      --line-strong: #c8bfae;
      --accent: #12c8b4;
      --accent-dark: #0e6f67;
      --accent-soft: #d9fbf6;
      --blue: #2446ff;
      --coral: #ff6f61;
      --shadow: 0 24px 70px rgba(43, 36, 24, 0.13);
      --radius: 8px;
      font-family: Inter, "Avenir Next", "SF Pro Display", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, #fffaf0 0, #f6f4ee 45%, #eef7f4 100%);
      color: var(--ink);
      font: 16px/1.5 Inter, "Avenir Next", "SF Pro Display", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    }

    main {
      width: min(1040px, calc(100% - 48px));
      margin: 0 auto;
      padding: 56px 0;
    }

    .shell {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }

    header {
      position: sticky;
      top: 32px;
      min-width: 0;
    }

    .mark {
      display: inline-grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      margin-bottom: 30px;
      background: var(--surface-strong);
      box-shadow: var(--shadow);
      font-weight: 900;
      color: var(--accent-dark);
    }

    h1 {
      margin: 0;
      max-width: 620px;
      font-size: clamp(3rem, 8vw, 6.8rem);
      line-height: 0.9;
      letter-spacing: 0;
    }

    .summary {
      max-width: 610px;
      margin: 24px 0 0;
      color: var(--muted);
      font-size: clamp(1.05rem, 2vw, 1.28rem);
    }

    .agent-reason {
      margin-top: 26px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.72);
      padding: 18px;
      box-shadow: 0 12px 38px rgba(43, 36, 24, 0.08);
      min-width: 0;
    }

    .agent-reason h2,
    .storage-card h2 {
      margin: 0 0 8px;
      font-size: 0.82rem;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-dark);
    }

    .agent-reason p,
    .storage-card p {
      margin: 0;
      color: var(--muted);
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255, 253, 248, 0.96);
      box-shadow: var(--shadow);
      overflow: hidden;
      min-width: 0;
    }

    form {
      margin: 0;
    }

    .secret-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      padding: 28px;
      border-top: 1px solid var(--line);
      min-width: 0;
    }

    .secret-row:first-child {
      border-top: 0;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--coral);
      font-size: 0.72rem;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.09em;
    }

    label {
      display: block;
      font-weight: 860;
      font-size: 1.15rem;
      line-height: 1.15;
      margin-bottom: 10px;
    }

    code {
      display: inline-block;
      max-width: 100%;
      overflow-wrap: anywhere;
      border: 1px solid #b9eee6;
      border-radius: 6px;
      background: var(--accent-soft);
      color: var(--accent-dark);
      padding: 3px 7px;
      font: 0.88rem/1.4 "SF Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .field-note {
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 0.94rem;
    }

    .field-note span {
      display: block;
      margin-bottom: 3px;
      color: var(--ink);
      font-weight: 760;
    }

    .input-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-content: start;
      min-width: 0;
    }

    input {
      width: 100%;
      min-width: 0;
      min-height: 54px;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      padding: 0 15px;
      background: var(--surface-strong);
      color: var(--ink);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
      font: 1.02rem "SF Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    input::placeholder {
      color: #9b968d;
    }

    input:focus {
      outline: 4px solid rgba(18, 200, 180, 0.22);
      border-color: var(--accent-dark);
    }

    .actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
      padding: 24px 28px 28px;
      border-top: 1px solid var(--line);
      background: #fbf7ee;
    }

    .enter-note {
      margin: 0;
      color: var(--muted);
      font-size: 0.94rem;
    }

    button {
      min-height: 48px;
      border: 1px solid transparent;
      border-radius: var(--radius);
      padding: 0 18px;
      background: var(--accent);
      color: #052421;
      font: 850 0.98rem Inter, "Avenir Next", ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
      transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(18, 200, 180, 0.26);
    }

    button:disabled {
      cursor: wait;
      opacity: 0.72;
      transform: none;
      box-shadow: none;
    }

    .ghost {
      border-color: var(--line-strong);
      background: var(--surface-strong);
      color: var(--ink);
      min-width: 78px;
    }

    .ghost:hover {
      box-shadow: 0 10px 18px rgba(43, 36, 24, 0.08);
    }

    .error {
      margin: 0 0 16px;
      border: 1px solid #ffd1c9;
      border-radius: var(--radius);
      background: #fff1ee;
      color: #9f2417;
      padding: 12px 14px;
      font-weight: 800;
    }

    .storage-card {
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface-strong);
      padding: 20px;
      min-width: 0;
    }

    .storage-list {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .storage-item {
      display: grid;
      grid-template-columns: 94px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }

    .storage-item strong {
      color: var(--ink);
      font-size: 0.9rem;
    }

    .storage-item code {
      border-color: #d9d2c5;
      background: #f7f1e5;
      color: #4f493e;
    }

    @media (max-width: 880px) {
      main {
        width: min(100% - 24px, 1040px);
        padding: 30px 0;
      }

      .shell {
        grid-template-columns: 1fr;
      }

      header {
        position: static;
      }

      .secret-row,
      .input-wrap,
      .actions,
      .storage-item {
        grid-template-columns: 1fr;
      }

      .actions button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <main>
    <div class="shell">
      <header>
        <div class="mark">SM</div>
        <h1>${escapeHtml(spec.title)}</h1>
        <p class="summary">A local coding agent is asking you to provide secret values without exposing them in chat, terminal history, or logs.</p>

        <section class="agent-reason">
          <h2>Why the agent is asking</h2>
          <p>${escapeHtml(spec.reason)}</p>
        </section>

        <section class="storage-card">
          <h2>What happens when you press Enter</h2>
          <p>The value is saved locally on this machine and the terminal only receives a presence check.</p>
          <div class="storage-list">
            <div class="storage-item">
              <strong>Secret file</strong>
              <code>${storageValue(storage?.envPath || spec.envFile)}</code>
            </div>
            <div class="storage-item">
              <strong>Example</strong>
              <code>${storageValue(storage?.examplePath || spec.exampleFile)}</code>
            </div>
            <div class="storage-item">
              <strong>Metadata</strong>
              <code>${storageValue(storage?.manifestPath)}</code>
            </div>
          </div>
        </section>
      </header>

      <section class="panel">
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
        <form method="post" action="/submit?token=${encodeURIComponent(token)}">
          ${secrets.map(secretField).join("")}
          <div class="actions">
            <p class="enter-note">Press Enter from any secret field or use Save secrets.</p>
            <button type="submit">Save secrets</button>
          </div>
        </form>
      </section>
    </div>
  </main>

  <script>
    const form = document.querySelector("form");
    const submitButton = form.querySelector('button[type="submit"]');

    for (const input of form.querySelectorAll("input")) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          form.requestSubmit();
        }
      });
    }

    form.addEventListener("submit", () => {
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";
    });

    for (const button of document.querySelectorAll("[data-toggle]")) {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.toggle);
        input.type = input.type === "password" ? "text" : "password";
        button.textContent = input.type === "password" ? "Show" : "Hide";
      });
    }
  </script>
</body>
</html>`;
}

export function renderSuccessPage({ spec, savedNames, storage }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Secrets saved</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f4ee;
      --surface: #fffdf8;
      --ink: #141413;
      --muted: #68655e;
      --line: #ded8cb;
      --accent: #12c8b4;
      --accent-dark: #0e6f67;
      font-family: Inter, "Avenir Next", "SF Pro Display", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #fffaf0 0, #f6f4ee 55%, #eef7f4 100%);
      color: var(--ink);
      font: 16px/1.5 Inter, "Avenir Next", "SF Pro Display", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    }

    main {
      width: min(760px, calc(100% - 36px));
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      padding: clamp(28px, 6vw, 54px);
      box-shadow: 0 24px 70px rgba(43, 36, 24, 0.13);
    }

    .mark {
      display: inline-grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border: 1px solid var(--line);
      border-radius: 8px;
      margin-bottom: 28px;
      background: white;
      font-weight: 900;
      color: var(--accent-dark);
    }

    h1 {
      margin: 0 0 14px;
      font-size: clamp(3rem, 9vw, 6rem);
      line-height: 0.9;
      letter-spacing: 0;
    }

    p {
      color: var(--muted);
      font-size: 1.06rem;
    }

    code {
      color: var(--accent-dark);
      font-family: "SF Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }

    .storage {
      margin-top: 22px;
      border-top: 1px solid var(--line);
      padding-top: 18px;
    }
  </style>
</head>
<body>
  <main>
    <div class="mark">SM</div>
    <h1>Secrets saved</h1>
    <p>${savedNames.map((name) => `<code>${escapeHtml(name)}</code>`).join(", ")} ${savedNames.length === 1 ? "is" : "are"} ready for the local agent.</p>
    <div class="storage">
      <p>Stored in <code>${storageValue(storage?.envPath || spec.envFile)}</code>. Metadata was written to <code>${storageValue(storage?.manifestPath)}</code>. You can close this tab.</p>
    </div>
  </main>
</body>
</html>`;
}
