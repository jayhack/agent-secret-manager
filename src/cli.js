import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertEnvName, ensureSecretProject, readEnvValues, resolveProjectPath } from "./env-file.js";
import { readManifest } from "./manifest.js";
import { runSecretRequestServer } from "./server.js";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMAND_NAME = "agent-secret-manager";
const SKILL_NAME = "agent-secret-manager";
const NPX_COMMAND = "npx agent-secret-manager";

function printHelp() {
  console.log(`${COMMAND_NAME}

Usage:
  ${COMMAND_NAME} request <ENV_NAME...> [--agent codex] [--reason text] [--env .env]
  ${COMMAND_NAME} request --from secrets.request.json
  ${COMMAND_NAME} check <ENV_NAME...> [--env .env]
  ${COMMAND_NAME} list [--env .env]
  ${COMMAND_NAME} run [--env .env] -- <command>
  ${COMMAND_NAME} init [--env .env]
  ${COMMAND_NAME} skill path
  ${COMMAND_NAME} skill install [--codex-home ~/.codex]

Common request options:
  --agent <name>       Agent name shown in the browser form (default: agent)
  --title <text>       Browser page title
  --reason <text>      Why the agent needs these secrets
  --env <path>         Env file to update (default: .env)
  --example <path>     Example env file to update with blank keys (default: .env.example)
  --port <number>      Localhost port (default: random)
  --timeout <seconds>  Seconds to wait for form submission (default: 900, 0 disables)
  --open / --no-open   Open the browser automatically (default: --open)
`);
}

function parseOptions(args) {
  const options = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      options._.push(...args.slice(index + 1));
      break;
    }
    if (!arg.startsWith("--")) {
      options._.push(arg);
      continue;
    }

    if (arg.startsWith("--no-")) {
      options[toCamel(arg.slice(5))] = false;
      continue;
    }

    const equal = arg.indexOf("=");
    if (equal !== -1) {
      options[toCamel(arg.slice(2, equal))] = arg.slice(equal + 1);
      continue;
    }

    const key = toCamel(arg.slice(2));
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function envLabel(name) {
  const names = new Map([
    ["API", "API"],
    ["URL", "URL"],
    ["URI", "URI"],
    ["ID", "ID"],
    ["JWT", "JWT"],
    ["SSH", "SSH"],
    ["HTTP", "HTTP"],
    ["HTTPS", "HTTPS"],
    ["OPENAI", "OpenAI"]
  ]);

  return name
    .split("_")
    .map((part) => {
      if (names.has(part)) {
        return names.get(part);
      }
      return part ? part[0] + part.slice(1).toLowerCase() : part;
    })
    .join(" ");
}

function normalizeSecret(secret) {
  if (typeof secret === "string") {
    assertEnvName(secret);
    return { name: secret, label: envLabel(secret), required: false, hidden: true };
  }

  if (!secret || typeof secret !== "object") {
    throw new Error("Each secret in the request spec must be a string or object.");
  }

  assertEnvName(secret.name);
  return {
    name: secret.name,
    label: secret.label || envLabel(secret.name),
    help: secret.help || "",
    reason: secret.reason || "",
    placeholder: secret.placeholder || "",
    required: secret.required === true,
    hidden: secret.hidden !== false
  };
}

async function loadRequestSpec(cwd, options) {
  const from = options.from || options.spec || options.json;
  if (!from) {
    return null;
  }

  const filePath = resolveProjectPath(cwd, from);
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (!Array.isArray(parsed.secrets) || parsed.secrets.length === 0) {
    throw new Error(`Request spec ${from} must include a non-empty "secrets" array.`);
  }
  return parsed;
}

export async function buildRequestSpec(cwd, options) {
  const fileSpec = await loadRequestSpec(cwd, options);
  const rawSecrets = fileSpec ? fileSpec.secrets : options._;
  if (!rawSecrets || rawSecrets.length === 0) {
    throw new Error("No secrets requested. Pass env var names or --from <request.json>.");
  }

  const secrets = rawSecrets.map(normalizeSecret);
  return {
    title: options.title || fileSpec?.title || "Secrets requested",
    agentName: options.agent || options.agentName || fileSpec?.agent || fileSpec?.agentName || "agent",
    reason: options.reason || options.why || fileSpec?.reason || "A local agent needs these values to continue setup without seeing the secret contents.",
    envFile: options.env || fileSpec?.envFile || ".env",
    exampleFile: options.example || fileSpec?.exampleFile || ".env.example",
    port: Number(options.port || fileSpec?.port || 0),
    secrets
  };
}

async function requestCommand(args) {
  const cwd = process.cwd();
  const options = parseOptions(args);
  const spec = await buildRequestSpec(cwd, options);
  const timeoutSeconds = Number(options.timeout ?? 900);
  const openBrowser = options.open !== false;

  console.log(`${COMMAND_NAME} request`);
  console.log(`Env file: ${resolveProjectPath(cwd, spec.envFile)}`);
  console.log(`Secrets: ${spec.secrets.map((secret) => secret.name).join(", ")}`);

  const result = await runSecretRequestServer({
    cwd,
    spec,
    openBrowser,
    timeoutSeconds,
    onReady({ url }) {
      console.log(`Open: ${url}`);
      console.log("Waiting for the browser form. Secret values will not be printed here.");
    }
  });

  if (result.savedNames.length > 0) {
    console.log(`Saved: ${result.savedNames.join(", ")}`);
  } else {
    console.log("Saved: none");
  }
  if (result.keptNames.length > 0) {
    console.log(`Kept existing: ${result.keptNames.join(", ")}`);
  }
  if (result.skippedNames.length > 0) {
    console.log(`Skipped: ${result.skippedNames.join(", ")}`);
  }
  console.log("Next: run `" + NPX_COMMAND + " check " + spec.secrets.map((secret) => secret.name).join(" ") + "` to verify presence without printing values.");
}

async function initCommand(args) {
  const cwd = process.cwd();
  const options = parseOptions(args);
  await ensureSecretProject(cwd, options.env || ".env", options.example || ".env.example");
  console.log(`Initialized ${COMMAND_NAME} in ${cwd}`);
  console.log(`Env file: ${resolveProjectPath(cwd, options.env || ".env")}`);
}

async function checkCommand(args) {
  const cwd = process.cwd();
  const options = parseOptions(args);
  if (options._.length === 0) {
    throw new Error("Pass at least one env var name to check.");
  }
  const keys = options._.map(assertEnvName);
  const envPath = resolveProjectPath(cwd, options.env || ".env");
  const values = await readEnvValues(envPath);
  let missing = 0;
  for (const key of keys) {
    if (values.has(key) && values.get(key) !== "") {
      console.log(`present ${key}`);
    } else {
      console.log(`missing ${key}`);
      missing += 1;
    }
  }
  if (missing > 0) {
    const error = new Error(`${missing} secret${missing === 1 ? "" : "s"} missing.`);
    error.exitCode = 1;
    throw error;
  }
}

async function listCommand(args) {
  const cwd = process.cwd();
  const options = parseOptions(args);
  const envPath = resolveProjectPath(cwd, options.env || ".env");
  const values = await readEnvValues(envPath);
  const manifest = await readManifest(cwd);
  const names = new Set([...Object.keys(manifest.secrets), ...values.keys()]);
  if (names.size === 0) {
    console.log("No secrets found.");
    return;
  }

  console.log(`Env file: ${envPath}`);
  for (const name of [...names].sort()) {
    const meta = manifest.secrets[name];
    const state = values.has(name) && values.get(name) !== "" ? "present" : "missing";
    const suffix = meta?.updatedAt ? ` updated ${meta.updatedAt}` : "";
    console.log(`${state} ${name}${suffix}`);
  }
}

async function runCommand(args) {
  const separator = args.indexOf("--");
  if (separator === -1) {
    throw new Error(`Use \`${COMMAND_NAME} run [--env .env] -- <command>\`.`);
  }

  const options = parseOptions(args.slice(0, separator));
  const command = args.slice(separator + 1);
  if (command.length === 0) {
    throw new Error("No command provided after --.");
  }

  const envPath = resolveProjectPath(process.cwd(), options.env || ".env");
  const values = Object.fromEntries(await readEnvValues(envPath));
  await new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: "inherit",
      env: { ...process.env, ...values }
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
      } else {
        process.exitCode = code ?? 1;
      }
      resolve();
    });
  });
}

async function skillCommand(args) {
  const [subcommand, ...rest] = args;
  const skillPath = path.join(PACKAGE_ROOT, "skills", SKILL_NAME);

  if (subcommand === "path" || !subcommand) {
    console.log(skillPath);
    return;
  }

  if (subcommand !== "install") {
    throw new Error("Unknown skill command. Use `skill path` or `skill install`.");
  }

  const options = parseOptions(rest);
  const codexHome = options.codexHome
    ? path.resolve(String(options.codexHome))
    : process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const target = path.join(codexHome, "skills", SKILL_NAME);

  try {
    await fs.access(target);
    if (options.force !== true) {
      throw new Error(`Skill already exists at ${target}. Re-run with --force to replace it.`);
    }
    await fs.rm(target, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(skillPath, target, { recursive: true });
  console.log(`Installed skill: ${target}`);
}

async function specCommand(args) {
  const options = parseOptions(args);
  const secrets = options._.length ? options._ : ["OPENAI_API_KEY"];
  const spec = {
    title: options.title || "Project secrets",
    agentName: options.agent || options.agentName || "agent",
    reason: options.reason || "Local setup needs these values.",
    envFile: options.env || ".env",
    exampleFile: options.example || ".env.example",
    secrets: secrets.map((name) => normalizeSecret(name))
  };
  console.log(JSON.stringify(spec, null, 2));
}

export async function main(argv) {
  const [command, ...args] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "request") return requestCommand(args);
  if (command === "init") return initCommand(args);
  if (command === "check") return checkCommand(args);
  if (command === "list") return listCommand(args);
  if (command === "run") return runCommand(args);
  if (command === "skill") return skillCommand(args);
  if (command === "spec") return specCommand(args);

  throw new Error(`Unknown command "${command}". Run ${COMMAND_NAME} --help.`);
}
