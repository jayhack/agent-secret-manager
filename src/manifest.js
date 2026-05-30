import { promises as fs } from "node:fs";
import path from "node:path";
import { chmodPrivate, pathExists } from "./env-file.js";

export function manifestPath(cwd) {
  return path.join(cwd, ".agent-secret-manager", "manifest.json");
}

export async function readManifest(cwd) {
  const filePath = manifestPath(cwd);
  if (!(await pathExists(filePath))) {
    return { version: 1, secrets: {} };
  }

  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    return {
      version: 1,
      secrets: parsed && typeof parsed.secrets === "object" && parsed.secrets ? parsed.secrets : {}
    };
  } catch {
    return { version: 1, secrets: {} };
  }
}

export async function updateManifest(cwd, { envFile, secrets, reason }) {
  const filePath = manifestPath(cwd);
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const manifest = await readManifest(cwd);
  const updatedAt = new Date().toISOString();

  for (const secret of secrets) {
    manifest.secrets[secret.name] = {
      name: secret.name,
      label: secret.label || secret.name,
      envFile,
      required: secret.required === true,
      hidden: secret.hidden !== false,
      reason: reason || "",
      updatedAt
    };
  }

  await fs.writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await chmodPrivate(filePath);
  return manifest;
}
