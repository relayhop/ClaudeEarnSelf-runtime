#!/usr/bin/env python3
"""
Scan a Gumroad snapshot.jsonl for prohibited-content matches.

Input:
  --snapshot  data/gumroad_ratings/<DATE>/snapshot.jsonl  (one product per line)
  --keywords  data/keywords/gumroad_prohibited_keywords.json
Output:
  --out       violations.jsonl  (one matched product per line + which rules hit)
  --summary   summary.json       (aggregate counts per rule + per layer)
"""
import argparse, json, re, sys
from collections import defaultdict

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--snapshot', required=True)
    ap.add_argument('--keywords', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--summary', required=True)
    args = ap.parse_args()

    with open(args.keywords) as f:
        kw = json.load(f)
    rules = []
    for r in kw['rules']:
        compiled = [re.compile(p, re.IGNORECASE) for p in r.get('patterns', [])]
        if compiled:
            rules.append({'id': r['id'], 'layer': r['layer'], 'rule': r['rule'],
                          'severity': r.get('severity', 'medium'), 'patterns': compiled})

    seen_ids = set()
    matches = []
    counts = defaultdict(int)
    layer_counts = defaultdict(int)
    severity_counts = defaultdict(int)
    n_total = 0

    with open(args.snapshot) as f:
        for line in f:
            try:
                p = json.loads(line)
            except json.JSONDecodeError:
                continue
            n_total += 1
            pid = p.get('id')
            if pid in seen_ids:
                continue
            seen_ids.add(pid)
            haystack = ((p.get('name') or '') + ' ' + (p.get('desc_preview') or '')).strip()
            if not haystack:
                continue
            hits = []
            for r in rules:
                for pat in r['patterns']:
                    if pat.search(haystack):
                        hits.append({'rule_id': r['id'], 'rule': r['rule'],
                                     'layer': r['layer'], 'severity': r['severity'],
                                     'pattern': pat.pattern})
                        counts[r['id']] += 1
                        layer_counts[f"layer_{r['layer']}"] += 1
                        severity_counts[r['severity']] += 1
                        break  # one hit per rule per product
            if hits:
                matches.append({
                    'id': pid, 'name': p.get('name'),
                    'native_type': p.get('native_type'), 'price_cents': p.get('price_cents'),
                    'cat': p.get('cat'), 'sort_seen': p.get('sort'),
                    'url': p.get('url'),
                    'matched_rules': hits
                })

    with open(args.out, 'w') as o:
        for m in matches:
            o.write(json.dumps(m) + '\n')

    summary = {
        'snapshot_rows': n_total,
        'unique_products': len(seen_ids),
        'violation_count': len(matches),
        'violation_rate_pct': round(len(matches) * 100 / max(len(seen_ids), 1), 2),
        'per_rule': dict(counts),
        'per_layer': dict(layer_counts),
        'per_severity': dict(severity_counts),
    }
    with open(args.summary, 'w') as o:
        json.dump(summary, o, indent=2)
    print(f"scanned {n_total} rows / {len(seen_ids)} unique → {len(matches)} violations ({summary['violation_rate_pct']}%)")
    print(f"  by layer: {dict(layer_counts)}")
    print(f"  by severity: {dict(severity_counts)}")

if __name__ == '__main__':
    main()
