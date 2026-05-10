import { promises as fs } from "node:fs";
import path from "node:path";

export const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertEnvName(name) {
  if (!ENV_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid env var name "${name}". Use letters, digits, and underscores, starting with a letter or underscore.`);
  }
  return name;
}

export function resolveProjectPath(cwd, value) {
  const target = value || ".env";
  return path.isAbsolute(target) ? target : path.join(cwd, target);
}

export async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function chmodPrivate(filePath) {
  try {
    await fs.chmod(filePath, 0o600);
  } catch {
    // Best effort on filesystems that do not support POSIX modes.
  }
}

export async function ensurePrivateFile(filePath, initialContent = "") {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (!(await pathExists(filePath))) {
    await fs.writeFile(filePath, initialContent, { mode: 0o600 });
  }
  await chmodPrivate(filePath);
}

export function quoteEnvValue(value) {
  const raw = String(value);
  const escaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$");
  return `"${escaped}"`;
}

export function parseEnvValue(rawValue) {
  let value = rawValue.trim();
  if (!value) {
    return "";
  }

  if (value.startsWith('"')) {
    let output = "";
    for (let index = 1; index < value.length; index += 1) {
      const char = value[index];
      if (char === '"') {
        break;
      }
      if (char === "\\" && index + 1 < value.length) {
        const next = value[index + 1];
        if (next === "n") output += "\n";
        else if (next === "r") output += "\r";
        else if (next === "t") output += "\t";
        else output += next;
        index += 1;
      } else {
        output += char;
      }
    }
    return output;
  }

  if (value.startsWith("'")) {
    const end = value.indexOf("'", 1);
    return end === -1 ? value.slice(1) : value.slice(1, end);
  }

  const comment = value.search(/\s#/);
  if (comment !== -1) {
    value = value.slice(0, comment);
  }
  return value.trim();
}

export function parseEnvFileContent(content) {
  const values = new Map();
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }
    values.set(match[1], parseEnvValue(match[2]));
  }

  return values;
}

export async function readEnvValues(filePath) {
  if (!(await pathExists(filePath))) {
    return new Map();
  }
  const content = await fs.readFile(filePath, "utf8");
  return parseEnvFileContent(content);
}

export async function upsertEnvValues(filePath, updates) {
  const entries = Object.entries(updates);
  for (const [key] of entries) {
    assertEnvName(key);
  }

  await ensurePrivateFile(filePath, "# Created by agent-secrets. Values are local-only; do not commit.\n");
  const original = await fs.readFile(filePath, "utf8");
  const lines = original.replace(/\r\n/g, "\n").split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  const updated = new Set();
  const updateMap = new Map(entries);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*)$/);
    if (!match || !updateMap.has(match[2])) {
      continue;
    }
    const key = match[2];
    lines[index] = `${match[1]}${key}${match[3]}${quoteEnvValue(updateMap.get(key))}`;
    updated.add(key);
  }

  const missing = entries.filter(([key]) => !updated.has(key));
  if (missing.length > 0) {
    if (lines.length > 0 && lines[lines.length - 1].trim() !== "") {
      lines.push("");
    }
    lines.push("# agent-secrets managed values");
    for (const [key, value] of missing) {
      lines.push(`${key}=${quoteEnvValue(value)}`);
      updated.add(key);
    }
  }

  await fs.writeFile(filePath, `${lines.join("\n")}\n`, { mode: 0o600 });
  await chmodPrivate(filePath);
  return { filePath, updated: [...updated] };
}

export async function ensureGitignore(cwd) {
  const filePath = path.join(cwd, ".gitignore");
  const desired = [
    "# agent-secrets",
    ".agent-secrets/",
    ".env",
    ".env.*",
    "!.env.example"
  ];
  let content = "";
  if (await pathExists(filePath)) {
    content = await fs.readFile(filePath, "utf8");
  }

  const existing = new Set(content.split(/\r?\n/).map((line) => line.trim()));
  const missing = desired.filter((line) => !existing.has(line));
  if (missing.length === 0) {
    return false;
  }

  const prefix = content && !content.endsWith("\n") ? "\n" : "";
  const spacer = content.trim() ? "\n" : "";
  await fs.writeFile(filePath, `${content}${prefix}${spacer}${missing.join("\n")}\n`);
  return true;
}

export async function updateEnvExample(examplePath, secrets) {
  await fs.mkdir(path.dirname(examplePath), { recursive: true });
  let content = "";
  if (await pathExists(examplePath)) {
    content = await fs.readFile(examplePath, "utf8");
  }

  const existing = parseEnvFileContent(content);
  const missing = secrets.filter((secret) => !existing.has(secret.name));
  if (missing.length === 0) {
    return false;
  }

  const lines = [];
  if (content && !content.endsWith("\n")) {
    lines.push("");
  }
  if (content.trim()) {
    lines.push("");
  }
  lines.push("# Added by agent-secrets for agent-readable configuration");
  for (const secret of missing) {
    lines.push(`${secret.name}=`);
  }

  await fs.writeFile(examplePath, `${content}${lines.join("\n")}\n`);
  return true;
}

export async function ensureSecretProject(cwd, envFile = ".env", exampleFile = ".env.example") {
  await ensureGitignore(cwd);
  await ensurePrivateFile(resolveProjectPath(cwd, envFile), "# Created by agent-secrets. Values are local-only; do not commit.\n");
  await fs.mkdir(path.join(cwd, ".agent-secrets"), { recursive: true, mode: 0o700 });
  await ensurePrivateFile(path.join(cwd, ".agent-secrets", "manifest.json"), "{\n  \"version\": 1,\n  \"secrets\": {}\n}\n");
  await updateEnvExample(resolveProjectPath(cwd, exampleFile), []);
}
