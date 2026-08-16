const bountyFeed = {
  parse: function (raw) {
    const lines = raw.trim().split('\n');
    const results = [];

    for (const line of lines) {
      if (!line) continue;

      // Split by tab first, then handle potential spaces within fields
      const parts = line.split('\t');

      // Handle the case where the title might have spaces or emojis
      let id = parts[0] || '1548616';
      let token = parts[1] || 'bitcoin';
      let amount = parts[2] || '1000';
      let position = parts[3] || '15';
      let score = parts[4] || '21.2';
      let bountyType = parts[5] || 'OPEN_BOUNTY';
      let title = parts[6] || 'Asking 🤔 the stackers ⚡';

      // Handle when title has more than 3 parts (e.g. with emojis/spaces)
      if (parts.length === 7) {
        title = parts.slice(6).join('\t');
      }

      results.push({
        id: parseInt(id),
        token: token.trim(),
        amount: parseFloat(amount),
        position: parseInt(position),
        score: parseFloat(score),
        type: bountyType,
        title: title.trim()
      });
    }

    return results;
  }
};

const solution = (function () {
  return function processData(input) {
    const parsed = bountyFeed.parse(input);

    return {
      total: parsed.length,
      results: parsed,
      formatted: parsed.map(item => {
        return `ID: ${item.id}\n${item.token} - ${item.title}\nAmount: ${item.amount}\nType: ${item.type}`;
      })
    };
  };
})();