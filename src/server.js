import http from "node:http";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { URL } from "node:url";
import { readEnvValues, resolveProjectPath, ensureGitignore, updateEnvExample, upsertEnvValues } from "./env-file.js";
import { updateManifest } from "./manifest.js";
import { renderRequestPage, renderSuccessPage } from "./html.js";

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(html);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function openUrl(url) {
  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}

function validateToken(requestUrl, token) {
  const parsed = new URL(requestUrl, "http://127.0.0.1");
  return parsed.searchParams.get("token") === token;
}

export async function runSecretRequestServer({ cwd, spec, openBrowser = true, timeoutSeconds = 900, onReady = () => {} }) {
  const token = randomBytes(24).toString("base64url");
  const envPath = resolveProjectPath(cwd, spec.envFile);
  const examplePath = resolveProjectPath(cwd, spec.exampleFile || ".env.example");
  let existingValues = await readEnvValues(envPath);
  let server;
  let timeout;

  const result = await new Promise((resolve, reject) => {
    server = http.createServer(async (request, response) => {
      try {
        if (!validateToken(request.url || "/", token)) {
          response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
          response.end("Forbidden\n");
          return;
        }

        const parsed = new URL(request.url || "/", "http://127.0.0.1");
        if (request.method === "GET" && parsed.pathname === "/") {
          existingValues = await readEnvValues(envPath);
          sendHtml(response, 200, renderRequestPage({ spec, token, existingValues }));
          return;
        }

        if (request.method === "POST" && parsed.pathname === "/submit") {
          const params = new URLSearchParams(await readBody(request));
          existingValues = await readEnvValues(envPath);
          const updates = {};

          for (let index = 0; index < spec.secrets.length; index += 1) {
            const secret = spec.secrets[index];
            const value = params.get(`secret_${index}`) || "";
            const hasExisting = existingValues.has(secret.name) && existingValues.get(secret.name) !== "";

            if (!value && !hasExisting && secret.required !== false) {
              sendHtml(response, 400, renderRequestPage({
                spec,
                token,
                existingValues,
                error: `${secret.name} is required.`
              }));
              return;
            }

            if (value) {
              updates[secret.name] = value;
            }
          }

          if (Object.keys(updates).length > 0) {
            await ensureGitignore(cwd);
            await upsertEnvValues(envPath, updates);
            await updateEnvExample(examplePath, spec.secrets);
            await updateManifest(cwd, {
              envFile: spec.envFile,
              secrets: spec.secrets.filter((secret) => Object.hasOwn(updates, secret.name)),
              reason: spec.reason
            });
          }

          const savedNames = Object.keys(updates);
          sendHtml(response, 200, renderSuccessPage({
            spec,
            savedNames: savedNames.length ? savedNames : spec.secrets.map((secret) => secret.name)
          }));
          resolve({ savedNames, envPath });
          setTimeout(() => server.close(), 25);
          return;
        }

        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found\n");
      } catch (error) {
        reject(error);
      }
    });

    server.on("error", reject);
    server.listen(spec.port || 0, "127.0.0.1", () => {
      const address = server.address();
      const url = `http://127.0.0.1:${address.port}/?token=${encodeURIComponent(token)}`;
      onReady({ url, envPath });
      if (openBrowser) {
        openUrl(url);
      }
    });

    if (timeoutSeconds > 0) {
      timeout = setTimeout(() => {
        const error = new Error(`Timed out waiting for secrets after ${timeoutSeconds} seconds.`);
        error.exitCode = 124;
        reject(error);
        server.close();
      }, timeoutSeconds * 1000);
    }
  });

  if (timeout) {
    clearTimeout(timeout);
  }
  return result;
}
