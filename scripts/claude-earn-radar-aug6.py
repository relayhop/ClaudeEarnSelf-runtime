import json
import re

def parse_high_priority_signals(raw_text):
    signals = []
    lines = raw_text.strip().split('\n')
    for line in lines:
        parts = re.split(r'\t+|\s{2,}', line.strip())
        if len(parts) >= 5:
            signals.append({
                "score": parts[0],
                "source": parts[1],
                "priority": parts[2],
                "reward": parts[3],
                "status": parts[4],
                "url": parts[5] if len(parts) > 5 else "",
                "description": parts[6] if len(parts) > 6 else ""
            })
    return signals

if __name__ == "__main__":
    sample = "6\tsn/bitcoin\t3.9\t-\tOPEN_NEED,LOW_COMP\thttps://stacker.news/items/1541175\tjoinmarket-clientserver makers"
    parsed = parse_high_priority_signals(sample)
    print(json.dumps(parsed, indent=2))
