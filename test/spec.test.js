import test from "node:test";
import assert from "node:assert/strict";
import { buildRequestSpec } from "../src/cli.js";

test("buildRequestSpec builds a request from positional env names", async () => {
  const spec = await buildRequestSpec(process.cwd(), {
    _: ["OPENAI_API_KEY"],
    reason: "Run the demo",
    env: ".env.local"
  });

  assert.equal(spec.envFile, ".env.local");
  assert.equal(spec.reason, "Run the demo");
  assert.equal(spec.secrets[0].name, "OPENAI_API_KEY");
  assert.equal(spec.secrets[0].label, "OpenAI API Key");
});
