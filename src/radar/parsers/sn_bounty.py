import re
from typing import Optional, Dict, Any

def parse_bounty_record(raw_line: str) -> Optional[Dict[str, Any]]:
    """
    Parses a raw bounty string from the SN radar feed.
    Handles tab-separated values, irregular spacing, and UTF-8 emojis.
    """
    if not raw_line or not raw_line.strip():
        return None

    # Split by tab first, fallback to whitespace if tabs are inconsistent
    parts = raw_line.split('\t')
    if len(parts) < 7:
        parts = re.split(r'\s+', raw_line.strip(), maxsplit=6)

    if len(parts) < 7:
        raise ValueError(f"Malformed bounty record: {raw_line}")

    try:
        return {
            "bounty_id": int(parts[0]),
            "asset": parts[1].strip().lower(),
            "principal": int(parts[2]),
            "blocks_remaining": int(parts[3]),
            "apr_estimate": float(parts[4]),
            "status": parts[5].strip().upper(),
            "memo": parts[6].strip()
        }
    except (ValueError, IndexError) as e:
        raise ValueError(f"Failed to parse bounty fields: {e}") from e
