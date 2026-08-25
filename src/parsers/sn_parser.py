from typing import Dict, Any, List

def parse_sn_bounty(raw_line: str) -> Dict[str, Any]:
    """Parse a Stacker News bounty log line."""
    parts = raw_line.strip().split('\t')
    if len(parts) < 7:
        raise ValueError(f"Invalid bounty line format: {raw_line}")

    tags_raw = parts[5]
    tags = [tag.strip() for tag in tags_raw.split(',') if tag.strip()]

    return {
        "id": int(parts[0]),
        "category": parts[1],
        "amount": int(parts[2]),
        "comments": int(parts[3]),
        "score": float(parts[4]),
        "tags": tags,
        "title": parts[6],
        "is_hot": "HOT" in tags,
        "is_open_bounty": "OPEN_BOUNTY" in tags
    }
