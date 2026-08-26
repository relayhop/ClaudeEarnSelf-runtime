import { Bounty, RadarConfig, ScanResult } from '../types/radar';

const SN_API_BASE = 'https://stacker.news/api';
const DEFAULT_TIMEOUT_MS = 30000;

export class SNScannerer {
  private config: RadarConfig;
  private timeout: number;

  constructor(config: RadarConfig) {
    this.config = config;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  async scanOpenBounties(): Promise<ScanResult[]> {
    const url = `${SN_API_BASE}/items?sort=recent&type=bounty&status=open`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.timeout),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ClaudeEarnSelf-Radar/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`SN API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as SNApiResponse[];
    return this.parseBounties(data);
  }

  private parseBounties(items: SNApiResponse[]): ScanResult[] {
    const results: ScanResult[] = [];

    for (const item of items) {
      if (!this.isOpenBounty(item)) {
        continue;
      }

      const bounty = this.extractBounty(item);
      if (bounty) {
        results.push({
          bounty,
          detectedAt: new Date().toISOString(),
          source: 'stacker_news',
          raw: JSON.stringify(item),
        });
      }
    }

    return results;
  }

  private isOpenBounty(item: SNApiResponse): boolean {
    if (!item.bounty || item.bounty <= 0) {
      return false;
    }

    const status = item.status?.toUpperCase() ?? '';
    if (status === 'CLOSED' || status === 'CANCELLED') {
      return false;
    }

    return true;
  }

  private extractBounty(item: SNApiResponse): Bounty | null {
    try {
      const rawTitle = item.title ?? '';
      const cleanTitle = this.sanitizeTitle(rawTitle);
      const tags = this.extractTags(item);
      const keywords = this.extractKeywords(cleanTitle);

      return {
        item_id: item.id,
        currency: 'bitcoin',
        amount: item.bounty ?? 0,
        upvotes: item.sats ?? 0,
        score: this.calculateScore(item),
        tags,
        title: cleanTitle,
        raw_title: rawTitle,
        url: `https://stacker.news/items/${item.id}`,
        status: 'open',
        category: this.categorize(keywords),
        keywords,
      };
    } catch (err) {
      console.error(`Failed to parse bounty ${item.id}:`, err);
      return null;
    }
  }

  private sanitizeTitle(raw: string): string {
    return raw
      .replace(/\u26a1/g, '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\u26a1/g, '')
      .trim();
  }

  private extractTags(item: SNApiResponse): string[] {
    const tags: string[] = [];

    if (item.bounty && item.bounty > 0) {
      tags.push('OPEN_BOUNTY');
    }

    const sats = item.sats ?? 0;
    if (sats >= 15) {
      tags.push('HOT');
    }

    return tags;
  }

  private extractKeywords(title: string): string[] {
    const stopWords = new Set(['the', 'best', 'for', 'a', 'an', 'how', 'to', 'tips', 'running', 'profitable']);
    const words = title
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 2 && !stopWords.has(w));

    return [...new Set(words)];
  }

  private calculateScore(item: SNApiResponse): number {
    const sats = item.sats ?? 0;
    const bounty = item.bounty ?? 0;
    const comments = item.ncomments ?? 0;

    return (sats * 0.5) + (bounty / 1000) + (comments * 0.3);
  }

  private categorize(keywords: string[]): string {
    const categoryMap: Record<string, string> = {
      lightning: 'lightning_network',
      lighting: 'lightning_network',
      node: 'lightning_network',
      bitcoin: 'bitcoin',
      mining: 'mining',
      wallet: 'wallets',
      channel: 'lightning_network',
      routing: 'lightning_network',
      liquidity: 'lightning_network',
      fee: 'lightning_network',
    };

    for (const kw of keywords) {
      if (categoryMap[kw]) {
        return categoryMap[kw];
      }
    }

    return 'general';
  }
}

interface SNApiResponse {
  id: number;
  title?: string;
  bounty?: number;
  sats?: number;
  ncomments?: number;
  status?: string;
  createdAt?: string;
  user?: { name?: string; id?: number };
}
