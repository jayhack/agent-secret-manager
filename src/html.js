function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function secretField(secret, index) {
  const existing = secret.present
    ? `<p class="hint">Already set. Leave blank to keep the existing value.</p>`
    : "";
  const required = secret.required === false || secret.present ? "" : "required";
  const help = secret.help ? `<p class="hint">${escapeHtml(secret.help)}</p>` : "";
  const placeholder = secret.placeholder || "Paste secret value";

  return `
    <section class="secret-row">
      <div class="secret-copy">
        <label for="secret-${index}">${escapeHtml(secret.label || secret.name)}</label>
        <code>${escapeHtml(secret.name)}</code>
        ${help}
        ${existing}
      </div>
      <div class="input-wrap">
        <input id="secret-${index}" name="secret_${index}" type="password" ${required} autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${escapeHtml(placeholder)}" />
        <button type="button" class="ghost" data-toggle="secret-${index}" aria-label="Show or hide ${escapeHtml(secret.name)}">Show</button>
      </div>
    </section>
  `;
}

export function renderRequestPage({ spec, token, existingValues, error = "" }) {
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
      color-scheme: light dark;
      --bg: #f7f3ea;
      --ink: #171717;
      --muted: #666a70;
      --line: #d7d0c2;
      --panel: #fffaf0;
      --accent: #0f766e;
      --accent-ink: #ffffff;
      --danger: #b42318;
      --shadow: 0 20px 60px rgba(36, 30, 20, 0.14);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111315;
        --ink: #f3f3f0;
        --muted: #a4a8ad;
        --line: #30363d;
        --panel: #181b1f;
        --accent: #2dd4bf;
        --accent-ink: #06201d;
        --danger: #ff8a7a;
        --shadow: none;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(135deg, rgba(15, 118, 110, 0.10), transparent 38%),
        var(--bg);
      color: var(--ink);
      font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main {
      width: min(920px, calc(100% - 32px));
      margin: 0 auto;
      padding: 48px 0;
    }

    header {
      margin-bottom: 24px;
    }

    .mark {
      display: inline-grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      margin-bottom: 18px;
      background: var(--panel);
      box-shadow: var(--shadow);
      font-weight: 800;
      color: var(--accent);
    }

    h1 {
      margin: 0;
      max-width: 760px;
      font-size: clamp(2rem, 6vw, 4.8rem);
      line-height: 0.95;
      letter-spacing: 0;
    }

    .reason {
      max-width: 680px;
      color: var(--muted);
      margin: 18px 0 0;
      font-size: 1.05rem;
    }

    form {
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, var(--panel) 72%, transparent);
    }

    .secret-row {
      display: grid;
      grid-template-columns: minmax(0, 0.8fr) minmax(260px, 1.2fr);
      gap: 24px;
      padding: 22px 0;
      border-top: 1px solid var(--line);
    }

    .secret-row:first-child {
      border-top: 0;
    }

    label {
      display: block;
      font-weight: 760;
      font-size: 1rem;
      margin-bottom: 8px;
    }

    code {
      display: inline-block;
      max-width: 100%;
      overflow-wrap: anywhere;
      color: var(--accent);
      font: 0.9rem/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .hint {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 0.92rem;
    }

    .input-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-content: start;
    }

    input {
      width: 100%;
      min-height: 46px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0 12px;
      background: var(--bg);
      color: var(--ink);
      font: 1rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    input:focus {
      outline: 3px solid color-mix(in srgb, var(--accent) 28%, transparent);
      border-color: var(--accent);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 22px 0 0;
    }

    button {
      min-height: 42px;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 0 16px;
      background: var(--accent);
      color: var(--accent-ink);
      font: 760 0.96rem ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
    }

    button:hover {
      filter: brightness(0.96);
    }

    .ghost {
      border-color: var(--line);
      background: transparent;
      color: var(--ink);
      min-width: 68px;
    }

    .error {
      margin: 0 0 16px;
      color: var(--danger);
      font-weight: 700;
    }

    footer {
      margin-top: 18px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    @media (max-width: 720px) {
      main {
        width: min(100% - 24px, 920px);
        padding: 28px 0;
      }

      .secret-row,
      .input-wrap {
        grid-template-columns: 1fr;
      }

      .actions {
        justify-content: stretch;
      }

      .actions button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="mark">AS</div>
      <h1>${escapeHtml(spec.title)}</h1>
      <p class="reason">${escapeHtml(spec.reason)}</p>
    </header>

    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}

    <form method="post" action="/submit?token=${encodeURIComponent(token)}">
      ${secrets.map(secretField).join("")}
      <div class="actions">
        <button type="submit">Save secrets</button>
      </div>
    </form>

    <footer>Saved values are written to ${escapeHtml(spec.envFile)} on this machine and are not printed in the terminal.</footer>
  </main>

  <script>
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

export function renderSuccessPage({ spec, savedNames }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Secrets saved</title>
  <style>
    :root { color-scheme: light dark; --bg: #f7f3ea; --ink: #171717; --muted: #666a70; --accent: #0f766e; }
    @media (prefers-color-scheme: dark) { :root { --bg: #111315; --ink: #f3f3f0; --muted: #a4a8ad; --accent: #2dd4bf; } }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--ink); font: 16px/1.5 ui-sans-serif, system-ui, sans-serif; }
    main { width: min(680px, calc(100% - 32px)); }
    h1 { margin: 0 0 14px; font-size: clamp(2.4rem, 8vw, 5rem); line-height: 0.95; letter-spacing: 0; }
    p { color: var(--muted); font-size: 1.05rem; }
    code { color: var(--accent); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main>
    <h1>Secrets saved</h1>
    <p>${savedNames.map((name) => `<code>${escapeHtml(name)}</code>`).join(", ")} ${savedNames.length === 1 ? "is" : "are"} ready in <code>${escapeHtml(spec.envFile)}</code>.</p>
    <p>You can close this tab.</p>
  </main>
</body>
</html>`;
}
