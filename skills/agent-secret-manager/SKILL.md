---
name: agent-secret-manager
description: Request local development secrets from the human through the agent-secret-manager CLI without exposing secret values to the agent. Use when a project needs API keys, tokens, passwords, webhooks, database URLs, or other env vars that should be entered by the user, stored locally in .env, checked for presence only, and injected into commands without printing or reading the values.
---

# Agent Secret Manager

Use the `agent-secret-manager` CLI whenever a task needs a secret value that is not already configured.

## Workflow

1. Identify the required env var names from errors, docs, `.env.example`, or project config.
2. Request them with `npx agent-secret-manager request` and provide a concrete reason that can be shown to the user:

   ```sh
   npx agent-secret-manager request OPENAI_API_KEY --reason "Run the local OpenAI example"
   ```

3. Tell the user to complete the localhost form if the CLI has not opened a browser automatically.
4. Wait for the command to finish. Do not ask the user to paste the value into chat.
5. Verify presence only:

   ```sh
   npx agent-secret-manager check OPENAI_API_KEY
   ```

6. Run commands normally if the project loads `.env`; otherwise inject the file without printing values:

   ```sh
   npx agent-secret-manager run -- npm test
   ```

## Structured Requests

For multiple secrets or clearer labels, write a request spec that contains no values:

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
      "help": "Create a project key in the OpenAI dashboard.",
      "required": true
    }
  ]
}
```

Then run:

```sh
npx agent-secret-manager request --from secrets.request.json
```

## Rules

- Never print, echo, cat, grep, screenshot, or summarize secret values.
- Prefer `npx agent-secret-manager check` over reading `.env`.
- Prefer `npx agent-secret-manager run -- <command>` when a command needs env vars but the project does not load `.env` itself.
- It is acceptable to read `.env.example` because it should contain only blank placeholders.
- Treat `.env`, `.env.*`, and `.agent-secret-manager/` as local secret storage and do not commit them.
