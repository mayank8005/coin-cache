# Coin Cache

A self-hostable personal budget PWA for a small household (1–3 users). Private-per-user data, 9 themes, optional LLM features (natural-language entry, monthly insights, anomaly flagging) — all fully local.

## Features

- Private-per-user budgets (no shared households in v1)
- 9 themes, selectable per user under `/settings` (default: **Bone / Matcha**)
- PWA — installable on iOS, Android, and desktop Chrome
- Natural-language transaction entry (e.g. _"thai takeaway 22 on apr 18"_) via any OpenAI-compatible LLM
- Weekly/monthly AI narratives + anomaly flagging, cached locally
- Fully offline-capable: service worker + graceful LLM degradation
- Argon2id password hashing, AES-256-GCM field encryption for card last-4
- SQLite + Prisma — single `data.db` file on a Docker volume
- Single `docker compose up` deploy

## Quickstart

```sh
cp .env.example .env        # edit AUTH_SECRET, ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, ENCRYPTION_KEY
docker compose up -d --build
pnpm admin user:add --email you@x.com --password '…' --name 'You'
# open http://localhost:3000
```

Generate the admin bcrypt hash once:

```sh
node -e 'require("bcryptjs").hash(process.argv[1], 12).then(console.log)' 'my-master-pass'
```

## Environment

| Key                   | Purpose                                              | Required |
| --------------------- | ---------------------------------------------------- | -------- |
| `AUTH_SECRET`         | Session signing key (`openssl rand -base64 48`)      | yes      |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of master password (gate `/api/admin/*`) | yes      |
| `ADMIN_PASSWORD`      | Plaintext for CLI; set only on operator machine      | CLI only |
| `ENCRYPTION_KEY`      | 32+ char random, derives per-user AES-GCM keys       | yes      |
| `DATABASE_URL`        | Prisma DSN; Docker uses `file:/app/data/data.db`     | yes      |
| `APP_URL`             | Base URL used by CLI & links                         | yes      |
| `LLM_BASE_URL`        | Legacy server-side AI endpoint; UI uses Settings     | no       |
| `LLM_API_KEY`         | Legacy server-side AI token                          | no       |
| `LLM_MODEL`           | Legacy server-side AI model id                       | no       |

## Admin CLI

```sh
pnpm admin user:add    --email a@b --password '…' --name 'Alex'
pnpm admin user:list
pnpm admin user:delete --email a@b
```

All commands POST to `/api/admin/*` with `X-Admin-Password`. curl equivalents:

```sh
curl -X POST "$APP_URL/api/admin/users" \
  -H "X-Admin-Password: $ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b","password":"…","displayName":"Alex"}'
```

## LLM

AI calls are made directly from the browser using each user's Settings values. Blank
settings prefill to the client-side default `http://192.168.0.95:11434` with model
`gemma4:e2b`; the app normalizes bare Ollama hosts to `/v1`.

Works with any OpenAI-compatible `/v1/chat/completions`. Tested targets:

- **Ollama** — `http://192.168.0.95:11434` or `http://localhost:11434`, no API key.
- **OpenRouter** — `https://openrouter.ai/api/v1`, API key required, model from your account.
- **LM Studio** — point at its local `/v1`.

When the browser cannot reach the endpoint, NL input and insights show the design's
offline placeholders. Core CRUD keeps working. For Ollama, set `OLLAMA_ORIGINS`
so the browser origin is allowed.

## Themes

All 9 palettes from the design are selectable per-user in Settings:
`Ink / Lime`, `Paper / Tomato`, `Cobalt`, `Midnight Teal`, `Charcoal / Citrus`, `Bone / Matcha` (default), `Plum`, `Cyan`, `Rose`.

Palette is persisted on `User.paletteId` and rendered server-side on `<html data-palette=…>`, so there's no flash on reload.

## Deploying to Hostinger

You need a **VPS plan** (Docker-capable). Shared hosting will not work.

1. Buy a Hostinger VPS plan.
2. `ssh` in as root; install Docker: `curl -fsSL https://get.docker.com | sh`.
3. `git clone` this repo, `cp .env.example .env`, fill it in.
4. `docker compose up -d --build`.
5. In hPanel, point a domain at the VPS.
6. Enable Let's Encrypt (hPanel auto-provisions) and reverse-proxy `:3000`.

## Deploying elsewhere

Same `docker-compose.yml` runs on any Docker host (Fly.io, a Raspberry Pi, a home server).

## Backup & restore

```sh
# backup
docker compose cp coin-cache:/app/data/data.db ./backup-$(date +%F).db

# restore
docker compose cp ./backup-2026-04-25.db coin-cache:/app/data/data.db
docker compose restart
```

Cron example (daily at 03:00):

```
0 3 * * * cd /opt/coin-cache && docker compose cp coin-cache:/app/data/data.db ./backups/$(date +\%F).db
```

## Security model

- Passwords: **argon2id** (memoryCost 64MB, timeCost 3).
- Admin master password: **bcrypt** (cost 12); plaintext never stored server-side.
- Sensitive fields (`Account.last4`): **AES-256-GCM**, per-user key derived via HKDF from `ENCRYPTION_KEY` + `userId`.
- Notes and amounts stored plaintext (searchable); recommend encrypting the Docker volume at the OS level.
- CSRF: SameSite=Lax session cookie + origin-checked Auth.js flows.
- Rate-limited `/api/auth` and `/api/admin` (in-memory token bucket — sized for ≤3 users).
- Headers: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy same-origin, Permissions-Policy lock-downs.
- Audit log of admin actions in `AuditLog` table.
- All input validated at the API boundary via Zod.
- LLM requests always issued server-side; no client-side secrets.

## Architecture

```
Browser (PWA) ⇄ Next.js app (App Router, SSR + API routes) ⇄ SQLite (/app/data/data.db)
                              ⇅ optional LLM endpoint (user-configured)
```

- `src/app/(app)/*` — authenticated screens
- `src/app/(auth)/login` — Credentials login
- `src/app/api/*` — REST API, all Zod-validated
- `src/lib/*` — auth, crypto, db, llm, session, repo
- `src/components/{primitives,viz,screens,layout}/*` — UI
- `src/constants/{palettes,categories,currencies,accounts}.ts`
- `scripts/admin-cli.ts` — admin CLI

## Development

```sh
pnpm i
pnpm prisma migrate dev
pnpm dev
pnpm admin user:add --email dev@local --password '…' --name 'Dev'
pnpm check          # typecheck + lint + format + license audit
```

## Contributing

- TypeScript strict, **no `any`**, no `as any`.
- Conventional commits; Husky pre-commit runs lint-staged.
- Prefer server components; add `"use client"` only where interactivity requires it.

## License

MIT.

## Roadmap

- TOTP / 2FA
- Shared households (multi-user pools)
- CSV import / Plaid-style bank sync
- Recurring transactions
