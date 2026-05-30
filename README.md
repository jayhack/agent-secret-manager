<p align="center">
  <a href="https://agent-secret-manager.com">
    <img src="assets/header.png" alt="agent-secret-manager — securely share secrets with coding agents" width="100%" />
  </a>
</p>

# agent-secret-manager

Agent-native secret requests for local projects. <a href="https://agent-secret-manager.com">agent-secret-manager.com</a>

`agent-secret-manager` gives coding agents a structured way to ask a human for API keys without pasting values into chat or terminal output. The CLI starts a localhost form, the human enters the value, and the CLI writes it into a local `.env` file with private file permissions.

## Quick start

```sh
npx agent-secret-manager request OPENAI_API_KEY --reason "Run the local OpenAI example"
```

The command prints and opens a localhost URL. The `--reason` text is shown in the form so the human can see why the agent is asking. The human can paste any values they have and leave the rest blank. After the form is submitted:

- `.env` contains submitted secret values.
- `.env.example` contains blank keys for agent-readable setup.
- `.gitignore` ignores `.env`, `.env.*`, and `.agent-secret-manager/`.
- `.agent-secret-manager/manifest.json` records metadata only, never values.

Verify without printing values:

```sh
npx agent-secret-manager check OPENAI_API_KEY
```

Run a command with the env file loaded:

```sh
npx agent-secret-manager run -- npm test
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
      "reason": "The integration tests call OpenAI.",
      "help": "Create a project key in the OpenAI dashboard."
    },
    {
      "name": "PROJECT_NAME",
      "label": "Project name",
      "help": "Shown in plain text — not a credential.",
      "hidden": false
    }
  ]
}
```

Use `"required": true` only when the form must block submission until that value is provided. Secrets default to optional masked inputs.

Then run:

```sh
npx agent-secret-manager request --from secrets.request.json
```

## Commands

```sh
agent-secret-manager init [--env .env]
agent-secret-manager request <ENV_NAME...> [--reason text] [--env .env]
agent-secret-manager request --from secrets.request.json
agent-secret-manager check <ENV_NAME...> [--env .env]
agent-secret-manager list [--env .env]
agent-secret-manager run [--env .env] -- <command>
agent-secret-manager spec <ENV_NAME...>
agent-secret-manager skill path
agent-secret-manager skill install
```

## Skill distribution

The package includes a Codex skill in `skills/agent-secret-manager`.

Install it from an npm install:

```sh
npx agent-secret-manager skill install
```

The skill tells agents to request missing secrets through this CLI, verify only presence, and avoid opening or printing the `.env` contents.

## Security model

This tool prevents routine secret exposure in prompts, screenshots, shell history, and agent logs. It stores secrets as plaintext in a local env file because that is what most local development tools already consume. It is not a sandbox boundary against a malicious local process or an agent that is explicitly instructed to read secret files.
