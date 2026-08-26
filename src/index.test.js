const { handleFetch, handleRadarWebhook } = require('./index');

describe('index', () => {
  describe('handleFetch', () => {
    test('returns health status on GET /health', async () => {
      const request = new Request('https://example.com/health', { method: 'GET' });
      const response = await handleFetch(request, {});
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ok');
    });

    test('returns 404 for unknown routes', async () => {
      const request = new Request('https://example.com/unknown', { method: 'GET' });
      const response = await handleFetch(request, {});
      expect(response.status).toBe(404);
    });
  });

  describe('handleRadarWebhook', () => {
    test('processes a valid radar issue', async () => {
      const issue = {
        number: 745,
        title: '[radar] SN open bounty 2026-08-18T10:05',
        body: 'New SN OPEN_BOUNTY detected:\n\n```\n1549793\tbitcoin\t5000\t18\t19.8\tOPEN_BOUNTY,HOT\tBest tips for running a profitable lighting node?\n```'
      };
      const request = new Request('https://example.com/webhook/radar', {
        method: 'POST',
        body: JSON.stringify({ issue })
      });
      const response = await handleRadarWebhook(request, {});
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ready');
      expect(body.bountyId).toBe(1549793);
    });

    test('returns 400 for missing issue data', async () => {
      const request = new Request('https://example.com/webhook/radar', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const response = await handleRadarWebhook(request, {});
      expect(response.status).toBe(400);
    });
  });
});
