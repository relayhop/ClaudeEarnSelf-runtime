const { parseBounty } = require('../src/radar/parser');

describe('parseBounty', () => {
  test('parses standard line with emojis', () => {
    const line = '1548616\tbitcoin\t1000\t15\t22.2\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡';
    const result = parseBounty(line);
    expect(result.id).toBe(1548616);
    expect(result.sub).toBe('bitcoin');
    expect(result.sats).toBe(1000);
    expect(result.comments).toBe(15);
    expect(result.satsPerComment).toBe(22.2);
    expect(result.status).toBe('OPEN_BOUNTY');
    expect(result.title).toBe('Asking 🤔 the stackers ⚡');
  });
});
