import re
from typing import Dict, Any

def parse_bounty_record(record: str) -> Dict[str, Any]:
    """Parses a tab-separated bounty record.
    
    Handles edge cases such as emojis in the description field.
    """
    parts = record.strip().split('\t')
    if len(parts) < 7:
        raise ValueError(f"Invalid record format: expected 7 fields, got {len(parts)}")
    
    try:
        record_id = int(parts[0])
        asset = parts[1]
        amount = int(parts[2])
        duration_days = int(parts[3])
        rate = float(parts[4])
        status = parts[5]
        description = '\t'.join(parts[6:])
    except ValueError as e:
        raise ValueError(f"Failed to parse numeric fields: {e}")
    
    return {
        "id": record_id,
        "asset": asset,
        "amount": amount,
        "duration_days": duration_days,
        "rate": rate,
        "status": status,
        "description": description
    }
