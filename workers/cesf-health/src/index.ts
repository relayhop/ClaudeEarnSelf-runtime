// cesf-health — minimal health-check Worker.
//
// Purpose: validate the wrangler deploy chain and provide a public endpoint
// the verify_seed workflow can ping to confirm the edge tier is alive.
//
// GET /        → { status, timestamp, git_sha?, region? }
// GET /healthz → same, kept as a conventional alias

const buildSha = (globalThis as any).BUILD_SHA ?? 'dev';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path !== '/' && path !== '/healthz') {
      return new Response('not found', { status: 404 });
    }

    const body = {
      status: 'ok',
      service: 'cesf-health',
      timestamp: new Date().toISOString(),
      build: buildSha,
      // request.cf is populated by Cloudflare's edge with the colo info.
      colo: (request as any).cf?.colo ?? null,
    };

    return new Response(JSON.stringify(body, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  },
};
