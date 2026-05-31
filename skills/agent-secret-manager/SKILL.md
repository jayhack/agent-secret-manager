---
name: agent-secret-manager
description: Use the agent-secret-manager npm CLI to request and manage local development secrets without exposing values to the agent. Trigger when a project needs API keys, tokens, passwords, webhooks, database URLs, or other env vars that should be entered by the human, stored locally in .env, checked only for presence, or injected into local commands.
---

# Agent Secret Manager

When setup, tests, migrations, deploy previews, or integrations need secret values, run `agent-secret-manager` through `npx` instead of asking the human to paste values into chat.

## Commands

Request one or more secrets:

```sh
npx agent-secret-manager request OPENAI_API_KEY --reason "Run the local OpenAI example"
```

Generate a request spec with no secret values:

```sh
npx agent-secret-manager spec OPENAI_API_KEY DATABASE_URL > secrets.request.json
```

Request from a spec:

```sh
npx agent-secret-manager request --from secrets.request.json
```

Verify presence without printing values:

```sh
npx agent-secret-manager check OPENAI_API_KEY
```

List managed names and present/missing state:

```sh
npx agent-secret-manager list
```

Run a command with `.env` loaded:

```sh
npx agent-secret-manager run -- npm test
```

Initialize local storage:

```sh
npx agent-secret-manager init
```

## Workflow

1. Identify required env var names from errors, docs, `.env.example`, or project config.
2. Run `npx agent-secret-manager request ...` with a concrete `--reason` the human can judge.
3. Let the human complete the localhost form. Do not ask them to paste values into chat.
4. Wait for the command to finish, then verify with `npx agent-secret-manager check ...`.
5. If the project does not load `.env` itself, run the needed command through `npx agent-secret-manager run -- <command>`.

## Request Specs

For multiple secrets or clearer labels, create a JSON request spec that contains names and instructions only, never values:

```json
{
  "title": "Project secrets",
  "reason": "The integration tests call external services.",
  "envFile": ".env",
  "exampleFile": ".env.example",
  "secrets": [
    {
      "name": "OPENAI_API_KEY",
      "label": "OpenAI API key",
      "reason": "The integration tests call OpenAI.",
      "help": "Create a project key in the OpenAI dashboard."
    },
    {
      "name": "PROJECT_NAME",
      "label": "Project name",
      "hidden": false
    }
  ]
}
```

Use `"required": true` only when the form must block submission until that value is provided. Use `"hidden": false` only for non-sensitive configuration (for example project names). Secrets default to optional masked password inputs.

## Benefits

- Secret values stay out of prompts, chat transcripts, shell history, terminal logs, and screenshots of the agent session.
- The human sees a concrete reason before entering each value.
- The agent can verify `present` or `missing` without reading `.env`.
- `.env.example` stays useful to the agent because it gets blank placeholders, not secret values.
- `.agent-secret-manager/manifest.json` stores metadata only.
- `run -- <command>` injects env vars for tools that do not load `.env` by default.

## Rules

- Never print, echo, cat, grep, screenshot, or summarize secret values.
- Prefer `npx agent-secret-manager check` over reading `.env`.
- Prefer `npx agent-secret-manager run -- <command>` when a command needs env vars but the project does not load `.env` itself.
- It is acceptable to read `.env.example` because it should contain only blank placeholders.
- Treat `.env`, `.env.*`, and `.agent-secret-manager/` as local secret storage and do not commit them.
