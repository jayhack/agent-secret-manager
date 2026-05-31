# Agent Instructions

## Production Publish

Production has two surfaces:

- GitHub Pages is served from `main` at `/docs`.
- The CLI is published to npm as `agent-secret-manager`.

Before publishing:

1. Make sure the intended changes are committed on top of current `origin/main`.
2. Bump `package.json` and `package-lock.json` to a new npm version. npm will not republish an existing version.
3. Run:

   ```sh
   npm run check
   npm test
   npm publish --dry-run
   ```

4. Push `main`, then verify GitHub Pages:

   ```sh
   gh api repos/jayhack/agent-secret-manager/pages/builds/latest
   ```

5. Publish npm with web authentication:

   ```sh
   npm publish --auth-type=web
   ```

   When npm prints `Press ENTER to open in the browser...`, press Enter. If needed, also open the printed `https://www.npmjs.com/auth/cli/...` URL in the in-app browser for the user. Wait for the user to approve the npm auth page and for `npm publish` to finish.

6. Verify npm:

   ```sh
   npm view agent-secret-manager version dist-tags --json
   ```

Do not treat npm's OTP/web-auth prompt as a blocker by itself. Use `npm publish --auth-type=web` and open the browser challenge for the user.

## Local Preview Artifacts

Preview runs may create `.env.example` or `.env.preview.example`. Do not commit generated env artifacts unless the user explicitly asks.
