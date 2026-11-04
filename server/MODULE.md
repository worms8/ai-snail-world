# server

**Purpose:** stateless Node LLM proxy. Owns the DeepSeek API key, rate limiting,
request validation, timeout/retry and JSON forwarding. Never bundled into the browser.

**Public API:** HTTP only.

- `GET /api/health` → `{ ok, service, version, phase }` (implemented)
- `POST /api/llm/complete` → validated DeepSeek chat completion (Phase 6)

**Files:** `index.ts` (listen), `app.ts` (Hono routes), `env.ts` (parsed config, Phase 6).

**May depend on:** npm packages (`hono`, `zod`, `dotenv`), Node built-ins. It must not
import `src/`.

**Invariants:**

- `DEEPSEEK_API_KEY` exists only in server memory from `.env`; never log it.
- Every route validates input and returns a typed error envelope.
- Requests time out; retries use bounded backoff; concurrent calls are capped.
- Stateless: no filesystem or database writes (safe as a serverless function).

**How to extend:** add a route to `app.ts`, validate with zod, add config to `env.ts`,
document the contract in `ARCHITECTURE.md`.
