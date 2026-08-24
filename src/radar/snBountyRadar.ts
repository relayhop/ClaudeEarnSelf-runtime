import { SNBounty, RadarStatus } from '../types';

export function parseRadarLine(line: string): SNBounty | null {
  const parts = line.split('\t');
  if (parts.length < 7) return null;

  const [id, network, amount, comments, metric, status, title] = parts;

  // Fix: explicitly handle new OPEN_BOUNTY status from SN
  const validStatuses: RadarStatus[] = ['OPEN_BOUNTY', 'CLAIMED', 'CLOSED', 'ACTIVE'];
  if (!validStatuses.includes(status as RadarStatus)) {
    return null;
  }

  return {
    id: parseInt(id, 10),
    network,
    amount: parseInt(amount, 10),
    comments: parseInt(comments, 10),
    metric: parseFloat(metric),
    status: status as RadarStatus,
    title: title.trim(),
    raw: line
  };
}
