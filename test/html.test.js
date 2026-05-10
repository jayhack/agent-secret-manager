import test from "node:test";
import assert from "node:assert/strict";
import { renderRequestPage } from "../src/html.js";

test("request page shows agent reason, storage explainer, and enter submit behavior", () => {
  const html = renderRequestPage({
    token: "token",
    existingValues: new Map(),
    storage: {
      envPath: "/tmp/project/.env",
      examplePath: "/tmp/project/.env.example",
      manifestPath: "/tmp/project/.agent-secret-manager/manifest.json"
    },
    spec: {
      title: "Connect OpenAI",
      reason: "The agent needs this key for a local integration test.",
      envFile: ".env",
      exampleFile: ".env.example",
      secrets: [
        {
          name: "OPENAI_API_KEY",
          label: "OpenAI API key",
          reason: "The demo server needs OpenAI access.",
          required: true
        }
      ]
    }
  });

  assert.match(html, /Why the agent is asking/);
  assert.match(html, /The agent needs this key for a local integration test\./);
  assert.match(html, /What happens when you press Enter/);
  assert.match(html, /\/tmp\/project\/\.env/);
  assert.match(html, /form\.requestSubmit\(\)/);
});
