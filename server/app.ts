import { Hono } from 'hono';

/**
 * Phase 0 proxy skeleton: health endpoint only. The DeepSeek forwarding route,
 * rate limiting, timeout/retry and validation arrive in Phase 6 (see
 * docs/ARCHITECTURE.md §LLM proxy).
 */
export function createApp(): Hono {
  const app = new Hono();

  app.get('/api/health', (c) =>
    c.json({
      ok: true,
      service: 'ai-snail-world-proxy',
      version: '0.1.0',
      phase: 0,
    }),
  );

  return app;
}
