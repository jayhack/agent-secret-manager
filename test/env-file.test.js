import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { parseEnvFileContent, quoteEnvValue, readEnvValues, updateEnvExample, upsertEnvValues } from "../src/env-file.js";

test("quoteEnvValue round-trips through parseEnvFileContent", () => {
  const value = 'sk-test # "quoted"\nnext\\line$';
  const parsed = parseEnvFileContent(`OPENAI_API_KEY=${quoteEnvValue(value)}\n`);
  assert.equal(parsed.get("OPENAI_API_KEY"), value);
});

test("upsertEnvValues updates existing keys and appends missing keys", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "agent-secret-manager-"));
  const envPath = path.join(dir, ".env");
  await upsertEnvValues(envPath, {
    OPENAI_API_KEY: "first",
    DATABASE_URL: "postgres://example"
  });
  await upsertEnvValues(envPath, {
    OPENAI_API_KEY: "second"
  });

  const content = await readFile(envPath, "utf8");
  assert.match(content, /OPENAI_API_KEY="second"/);
  assert.doesNotMatch(content, /OPENAI_API_KEY="first"/);

  const values = await readEnvValues(envPath);
  assert.equal(values.get("OPENAI_API_KEY"), "second");
  assert.equal(values.get("DATABASE_URL"), "postgres://example");

  if (process.platform !== "win32") {
    assert.equal((await stat(envPath)).mode & 0o777, 0o600);
  }
});

test("updateEnvExample adds blank keys without secret values", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "agent-secret-manager-"));
  const examplePath = path.join(dir, ".env.example");
  await updateEnvExample(examplePath, [
    { name: "OPENAI_API_KEY" },
    { name: "DATABASE_URL" }
  ]);

  const content = await readFile(examplePath, "utf8");
  assert.match(content, /^OPENAI_API_KEY=$/m);
  assert.match(content, /^DATABASE_URL=$/m);
});
