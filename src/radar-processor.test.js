const {
  extractBountyLine,
  processRadarIssue,
  formatSubmission
} = require('./radar-processor');

describe('radar-processor', () => {
  const SAMPLE_ISSUE_BODY = `New SN OPEN_BOUNTY detected:

\`\`\`
1549793\tbitcoin\t5000\t18\t19.8\tOPEN_BOUNTY,HOT\tBest tips for running a profitable lighting node?
\`\`\``;

  const SAMPLE_ISSUE = {
    number: 745,
    title: '[radar] SN open bounty 2026-08-18T10:05',
    body: SAMPLE_ISSUE_BODY,
    labels: [{ name: 'radar' }, { name: 'sn' }]
  };

  describe('extractBountyLine', () => {
    test('extracts bounty line from code block', () => {
      const line = extractBountyLine(SAMPLE_ISSUE_BODY);
      expect(line).not.toBeNull();
      expect(line).toContain('1549793');
      expect(line).toContain('bitcoin');
      expect(line).toContain('5000');
    });

    test('returns null for empty body', () => {
      expect(extractBountyLine('')).toBeNull();
      expect(extractBountyLine(null)).toBeNull();
    });

    test('falls back to line matching pattern', () => {
      const body = 'Some intro text\n1549793\tbitcoin\t5000\t18\t19.8\tOPEN_BOUNTY,HOT\tSome title';
      const line = extractBountyLine(body);
      expect(line).not.toBeNull();
      expect(line).toContain('1549793');
    });
  });

  describe('processRadarIssue', () => {
    test('processes a valid radar issue', () => {
      const result = processRadarIssue(SAMPLE_ISSUE);
      expect(result.status).toBe('success');
      expect(result.bounty.id).toBe(1549793);
      expect(result.category).toBe('lightning_node');
      expect(result.response).toContain('Lightning Network');
      expect(result.issueNumber).toBe(745);
    });

    test('returns error for invalid issue', () => {
      expect(processRadarIssue(null).status).toBe('error');
      expect(processRadarIssue({}).status).toBe('error');
      expect(processRadarIssue({ body: '' }).status).toBe('error');
    });
  });

  describe('formatSubmission', () => {
    test('formats a successful processing result', () => {
      const result = processRadarIssue(SAMPLE_ISSUE);
      const submission = formatSubmission(result);
      expect(submission.status).toBe('ready');
      expect(submission.bountyId).toBe(1549793);
      expect(submission.currency).toBe('bitcoin');
      expect(submission.amount).toBe(5000);
      expect(submission.comment).toContain('Lightning Network');
    });

    test('formats an error result', () => {
      const errorResult = { status: 'error', error: 'Test error', issueNumber: 745 };
      const submission = formatSubmission(errorResult);
      expect(submission.status).toBe('error');
      expect(submission.error).toBe('Test error');
    });

    test('formats a skipped result', () => {
      const skippedResult = { status: 'skipped', reason: 'Bounty is not open', issueNumber: 745 };
      const submission = formatSubmission(skippedResult);
      expect(submission.status).toBe('skipped');
    });
  });
});
