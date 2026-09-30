# Run doc — Nexus (Vite + React dev server)

## Reproduce the artifacts (fresh checkout)

1. Install dependencies with the project's package manager (npm, lockfile `package-lock.json`):
   ```
   npm install
   ```
2. Copy `.env.local` from the main checkout (`C:\Users\Darl\Nexus\.env.local`) into the worktree root — never symlink. It must contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (values live only in the main checkout; do not commit or paste them here).
3. No build artifacts are needed for dev mode — Vite compiles from source on request.

## Run the server

- Script: `npm run dev` (Vite). Default port **5173**, fallback **5174** if 5173 is busy (Vite auto-increments).
- Start detached on Windows so it outlives the session:
  ```
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
  ```
  (stdout and stderr must point at DIFFERENT files.)
- Confirm alive: `powershell -NoProfile -Command "Get-Process -Id <pid>"`, then wait for `curl -s -m 5 http://localhost:5173/` to return HTML before registering the preview.
- Routes: `/` (landing), `/login`, `/signup`, `/onboarding`, `/home` (dashboard).
