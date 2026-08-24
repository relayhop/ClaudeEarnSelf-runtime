/**
 * Parses raw Stacker News bounty TSV strings into structured objects.
 */
export class SnBountyParser {
  static parse(line) {
    if (!line || typeof line !== 'string') throw new Error('Invalid input');
    const cols = line.split('\t');
    if (cols.length < 7) throw new Error('Malformed record');
    const [id, asset, amountRaw, periodRaw, priceRaw, status, ...titleParts] = cols;
    return {
      id: id.trim(),
      asset: asset.trim(),
      amount: parseFloat(amountRaw),
      period: parseInt(periodRaw, 10),
      price: parseFloat(priceRaw),
      status: status.trim(),
      title: titleParts.join('\t').trim(),
      value: parseFloat(amountRaw) * parseFloat(priceRaw)
    };
  }
}
