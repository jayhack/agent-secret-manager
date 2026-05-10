# agent-secrets

Agent-native secret requests for local projects.

`agent-secrets` gives coding agents a structured way to ask a human for API keys without pasting values into chat or terminal output. The CLI starts a localhost form, the human enters the value, and the CLI writes it into a local `.env` file with private file permissions.

## Quick start

```sh
npx agent-secrets request OPENAI_API_KEY --reason "Run the local OpenAI example"
```

The command prints and opens a localhost URL. After the form is submitted:

- `.env` contains the secret value.
- `.env.example` contains blank keys for agent-readable setup.
- `.gitignore` ignores `.env`, `.env.*`, and `.agent-secrets/`.
- `.agent-secrets/manifest.json` records metadata only, never values.

Verify without printing values:

```sh
npx agent-secrets check OPENAI_API_KEY
```

Run a command with the env file loaded:

```sh
npx agent-secrets run -- npm test
```

## Structured requests

Agents can create a request spec with no secret values:

```json
{
  "title": "Project secrets",
  "reason": "The test suite calls external APIs.",
  "envFile": ".env",
  "exampleFile": ".env.example",
  "secrets": [
    {
      "name": "OPENAI_API_KEY",
      "label": "OpenAI API key",
      "help": "Create a project key in the OpenAI dashboard.",
      "required": true
    }
  ]
}
```

Then run:

```sh
npx agent-secrets request --from secrets.request.json
```

## Commands

```sh
agent-secrets init [--env .env]
agent-secrets request <ENV_NAME...> [--reason text] [--env .env]
agent-secrets request --from secrets.request.json
agent-secrets check <ENV_NAME...> [--env .env]
agent-secrets list [--env .env]
agent-secrets run [--env .env] -- <command>
agent-secrets spec <ENV_NAME...>
agent-secrets skill path
agent-secrets skill install
```

## Skill distribution

The package includes a Codex skill in `skills/agent-secrets`.

Install it from an npm install:

```sh
npx agent-secrets skill install
```

The skill tells agents to request missing secrets through this CLI, verify only presence, and avoid opening or printing the `.env` contents.

## Security model

This tool prevents routine secret exposure in prompts, screenshots, shell history, and agent logs. It stores secrets as plaintext in a local env file because that is what most local development tools already consume. It is not a sandbox boundary against a malicious local process or an agent that is explicitly instructed to read secret files.
