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

test("buildRequestSpec preserves per-secret explanation metadata", async () => {
  const spec = await buildRequestSpec(process.cwd(), {
    _: [
      {
        name: "DATABASE_URL",
        reason: "The migration command needs database access.",
        help: "Use the local development database URL.",
        placeholder: "postgres://..."
      }
    ]
  });

  assert.equal(spec.secrets[0].reason, "The migration command needs database access.");
  assert.equal(spec.secrets[0].help, "Use the local development database URL.");
  assert.equal(spec.secrets[0].placeholder, "postgres://...");
});

test("buildRequestSpec defaults hidden to true and accepts hidden false", async () => {
  const defaultSpec = await buildRequestSpec(process.cwd(), { _: ["OPENAI_API_KEY"] });
  assert.equal(defaultSpec.secrets[0].hidden, true);

  const visibleSpec = await buildRequestSpec(process.cwd(), {
    _: [{ name: "PROJECT_NAME", hidden: false }]
  });
  assert.equal(visibleSpec.secrets[0].hidden, false);
});

test("buildRequestSpec makes requested secrets optional unless required is explicit", async () => {
  const defaultSpec = await buildRequestSpec(process.cwd(), { _: ["OPENAI_API_KEY"] });
  assert.equal(defaultSpec.secrets[0].required, false);

  const requiredSpec = await buildRequestSpec(process.cwd(), {
    _: [{ name: "DATABASE_URL", required: true }]
  });
  assert.equal(requiredSpec.secrets[0].required, true);
});
