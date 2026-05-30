import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readEnvValues } from "../src/env-file.js";
import { runSecretRequestServer } from "../src/server.js";

test("secret request server accepts partial optional submissions", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "asm-partial-"));
  let ready;
  const readyPromise = new Promise((resolve) => {
    ready = resolve;
  });

  const resultPromise = runSecretRequestServer({
    cwd,
    openBrowser: false,
    timeoutSeconds: 5,
    spec: {
      title: "Project secrets",
      reason: "Test partial submission.",
      envFile: ".env",
      exampleFile: ".env.example",
      secrets: [
        { name: "OPENAI_API_KEY", label: "OpenAI API key", required: false, hidden: true },
        { name: "DATABASE_URL", label: "Database URL", required: false, hidden: true }
      ]
    },
    onReady: ready
  });

  const { url } = await readyPromise;
  const submitUrl = new URL("/submit", url);
  submitUrl.search = new URL(url).search;
  const response = await fetch(submitUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json" },
    body: new URLSearchParams({ secret_0: "sk-test", secret_1: "" })
  });
  const json = await response.json();
  const result = await resultPromise;
  const values = await readEnvValues(path.join(cwd, ".env"));

  assert.equal(response.status, 200);
  assert.deepEqual(json.saved, ["OPENAI_API_KEY"]);
  assert.deepEqual(json.skipped, ["DATABASE_URL"]);
  assert.deepEqual(result.savedNames, ["OPENAI_API_KEY"]);
  assert.deepEqual(result.skippedNames, ["DATABASE_URL"]);
  assert.equal(values.get("OPENAI_API_KEY"), "sk-test");
  assert.equal(values.has("DATABASE_URL"), false);
});

test("secret request server still enforces explicitly required secrets", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "asm-required-"));
  let ready;
  const readyPromise = new Promise((resolve) => {
    ready = resolve;
  });

  const resultPromise = runSecretRequestServer({
    cwd,
    openBrowser: false,
    timeoutSeconds: 5,
    spec: {
      title: "Project secrets",
      reason: "Test required submission.",
      envFile: ".env",
      exampleFile: ".env.example",
      secrets: [{ name: "DATABASE_URL", label: "Database URL", required: true, hidden: true }]
    },
    onReady: ready
  });

  const { url } = await readyPromise;
  const submitUrl = new URL("/submit", url);
  submitUrl.search = new URL(url).search;
  const response = await fetch(submitUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json" },
    body: new URLSearchParams({ secret_0: "" })
  });
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(json, { error: "DATABASE_URL is required." });

  await fetch(submitUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "accept": "application/json" },
    body: new URLSearchParams({ secret_0: "postgres://local" })
  });
  await resultPromise;
});
