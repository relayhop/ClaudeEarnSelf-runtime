"""Parse tab-separated Stacker News bounty data.

Handles edge cases:
- Unicode characters in titles (e.g. \u26a1)
- Comma-separated tags field
- Missing fields
- Extra whitespace
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


BOUNTIES_FILE = Path(__file__).parent.parent / "data" / "bounties.json"


def parse_bounty_line(line: str) -> Optional[dict]:
    """Parse a single tab-separated bounty line.

    Expected format:
        <id>\t<currency>\t<amount>\t<replies>\t<score>\t<tags>\t<title>

    Returns None for malformed lines.
    """
    if not line or not line.strip():
        return None

    parts = line.strip().split("\t")
    if len(parts) < 7:
        return None

    try:
        bounty_id = int(parts[0].strip())
    except ValueError:
        return None

    currency = parts[1].strip()
    if not currency:
        return None

    try:
        amount = int(parts[2].strip())
    except ValueError:
        return None

    try:
        replies = int(parts[3].strip())
    except ValueError:
        replies = 0

    try:
        score = float(parts[4].strip())
    except ValueError:
        score = 0.0

    tags_raw = parts[5].strip()
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    title = parts[6].strip()
    raw_title = title

    clean_title = title
    for char in ["\u26a1", "\U0001f525", "\u2728"]:
        clean_title = clean_title.replace(char, "")
    clean_title = clean_title.strip()

    status = "OPEN_BOUNTY" if "OPEN_BOUNTY" in tags else "CLOSED"

    return {
        "id": bounty_id,
        "currency": currency,
        "amount": amount,
        "replies": replies,
        "score": score,
        "tags": tags,
        "title": clean_title,
        "raw_title": raw_title,
        "status": status,
        "source": "stacker_news",
    }


def load_bounties() -> dict:
    """Load existing bounties from the data file."""
    if BOUNTIES_FILE.exists():
        with open(BOUNTIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"bounties": [], "schema_version": 1, "last_updated": None}


def add_bounty(bounty_data: dict) -> bool:
    """Add a bounty to the tracking file if not already present.

    Returns True if added, False if already existed.
    """
    data = load_bounties()

    existing_ids = {b["id"] for b in data["bounties"]}
    if bounty_data["id"] in existing_ids:
        return False

    bounty_data["detected_at"] = datetime.now(timezone.utc).isoformat()
    data["bounties"].append(bounty_data)
    data["last_updated"] = datetime.now(timezone.utc).isoformat()

    BOUNTIES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BOUNTIES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return True


def process_bounty_text(text: str) -> list[dict]:
    """Process multi-line bounty text and add all valid bounties."""
    added = []
    for line in text.strip().splitlines():
        parsed = parse_bounty_line(line)
        if parsed and add_bounty(parsed):
            added.append(parsed)
    return added


if __name__ == "__main__":
    sample = (
        "1549793\tbitcoin\t5000\t18\t20.5\t"
        "OPEN_BOUNTY,HOT\t\u26a1Best tips for running a profitable lighting node?\u26a1"
    )
    added = process_bounty_text(sample)
    print(f"Added {len(added)} bounty(ies)")
    for b in added:
        print(f"  - [{b['id']}] {b['title']} ({b['amount']} {b['currency']})")
