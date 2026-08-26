/**
 * ClaudeEarnSelf-runtime - Main entry point
 * Always-on runtime for ClaudeEarnSelf experiments on Cloudflare Workers + GitHub Actions
 */

const { processRadarIssue, formatSubmission } = require('./radar-processor');

/**
 * Cloudflare Worker fetch handler.
 * Processes incoming webhook from GitHub Actions when a radar issue is created.
 *
 * @param {Request} request - Incoming fetch request
 * @param {Object} env - Cloudflare Worker environment bindings
 * @returns {Promise<Response>}
 */
async function handleFetch(request, env) {
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/webhook/radar') {
    return handleRadarWebhook(request, env);
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

/**
 * Handle a radar webhook from GitHub Actions.
 * @param {Request} request 
 * @param {Object} env 
 * @returns {Promise<Response>}
 */
async function handleRadarWebhook(request, env) {
  try {
    const payload = await request.json();
    const issue = payload.issue || payload;

    if (!issue || !issue.body) {
      return new Response(JSON.stringify({
        status: 'error',
        error: 'Missing issue data in payload'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const result = processRadarIssue(issue);
    const submission = formatSubmission(result);

    // If we have a ready submission, store it in KV for the GitHub Action to pick up
    if (submission.status === 'ready' && env.BOUNTY_SUBMISSIONS) {
      const key = `submission:${issue.number}`;
      await env.BOUNTY_SUBMISSIONS.put(key, JSON.stringify(submission));
    }

    return new Response(JSON.stringify(submission), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error',
      error: err.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

module.exports = { handleFetch, handleRadarWebhook };

// Cloudflare Workers entry point
if (typeof addEventListener === 'function') {
  addEventListener('fetch', (event) => {
    event.respondWith(handleFetch(event.request, globalThis.env || {}));
  });
}
