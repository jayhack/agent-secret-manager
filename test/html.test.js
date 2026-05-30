import test from "node:test";
import assert from "node:assert/strict";
import { renderRequestPage, renderSuccessPage } from "../src/html.js";

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
  assert.match(html, /About this request/);
  assert.match(html, /What happens when you save/);
  assert.match(html, /\/tmp\/project\/\.env/);
  assert.match(html, /form\.requestSubmit\(\)/);
});

test("request page marks secrets optional unless explicitly required", () => {
  const html = renderRequestPage({
    token: "token",
    existingValues: new Map(),
    spec: {
      title: "Project config",
      reason: "Need project setup values.",
      secrets: [
        { name: "OPENAI_API_KEY", label: "OpenAI API key" },
        { name: "DATABASE_URL", label: "Database URL", required: true }
      ]
    }
  });

  assert.match(html, /Optional[\s\S]*?OPENAI_API_KEY/);
  assert.match(html, /Required[\s\S]*?DATABASE_URL/);
  assert.match(html, /Secrets requested by agent/);
  assert.doesNotMatch(html, /5\s+VARS/);
});

test("request page masks hidden secrets and shows plain text when hidden is false", () => {
  const html = renderRequestPage({
    token: "token",
    existingValues: new Map(),
    spec: {
      title: "Project config",
      reason: "Need API key and project name.",
      secrets: [
        { name: "OPENAI_API_KEY", label: "OpenAI API key", hidden: true },
        { name: "PROJECT_NAME", label: "Project name", hidden: false }
      ]
    }
  });

  assert.match(html, /id="secret-0"[\s\S]*?type="password"/);
  assert.match(html, /id="secret-0"[\s\S]*?data-form-type="other"/);
  assert.match(html, /id="secret-0"[\s\S]*?data-lpignore="true"/);
  assert.match(html, /id="secret-0"[\s\S]*?data-1p-ignore="true"/);
  assert.match(html, /id="secret-0"[\s\S]*?data-bwignore="true"/);
  assert.match(html, /id="secret-1"[\s\S]*?type="text"/);
  assert.doesNotMatch(html, /id="secret-1"[\s\S]*?data-form-type="other"/);
  assert.doesNotMatch(html, /data-toggle="secret-1"/);
});

test("request and success pages use .env request browser metadata", () => {
  const spec = {
    title: "Project config",
    reason: "Need API key.",
    envFile: ".env",
    secrets: [{ name: "OPENAI_API_KEY", label: "OpenAI API key" }]
  };
  const requestHtml = renderRequestPage({
    token: "token",
    existingValues: new Map(),
    spec
  });
  const successHtml = renderSuccessPage({
    spec,
    savedNames: ["OPENAI_API_KEY"]
  });

  for (const html of [requestHtml, successHtml]) {
    assert.match(html, /<title>\.env request<\/title>/);
    assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml;utf8,/);
    assert.match(html, /#16E6C4|%2316E6C4/);
    assert.match(html, /Space Grotesk/);
  }
});
