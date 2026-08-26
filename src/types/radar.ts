export interface Bounty {
  item_id: number;
  currency: string;
  amount: number;
  upvotes: number;
  score: number;
  tags: string[];
  title: string;
  raw_title: string;
  url: string;
  status: string;
  category: string;
  keywords: string[];
}

export interface ScanResult {
  bounty: Bounty;
  detectedAt: string;
  source: string;
  raw: string;
}

export interface RadarConfig {
  timeout?: number;
  minBountyAmount?: number;
  categories?: string[];
  webhookUrl?: string;
}

export interface RadarReport {
  scanId: string;
  timestamp: string;
  source: string;
  bountiesFound: number;
  results: ScanResult[];
}
