const parseBounty = (line) => {
  const parts = line.split('\t');
  if (parts.length < 7) throw new Error('Invalid bounty format');
  return {
    id: parseInt(parts[0], 10),
    network: parts[1],
    amount: parseFloat(parts[2]),
    duration: parseInt(parts[3], 10),
    rate: parseFloat(parts[4]),
    status: parts[5],
    description: parts[6]
  };
};

module.exports = { parseBounty };