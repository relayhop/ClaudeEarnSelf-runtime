const parseBounty = (line) => {
  const parts = line.split('\t');
  if (parts.length < 7) throw new Error('Invalid line format');
  
  return {
    id: parseInt(parts[0], 10),
    sub: parts[1],
    sats: parseInt(parts[2], 10),
    comments: parseInt(parts[3], 10),
    satsPerComment: parseFloat(parts[4]),
    status: parts[5],
    title: parts.slice(6).join('\t')
  };
};

module.exports = { parseBounty };
