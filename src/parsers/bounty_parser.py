from typing import Dict, Any

def parse_bounty_line(line: str) -> Dict[str, Any]:
    """Parses a tab-separated bounty line, correctly handling emojis and special characters in descriptions."""
    parts = line.strip().split('\t')
    if len(parts) < 7:
        raise ValueError(f'Invalid bounty line format: {line}')
    
    return {
        'id': int(parts[0]),
        'currency': parts[1],
        'amount': float(parts[2]),
        'difficulty': int(parts[3]),
        'score': float(parts[4]),
        'status': parts[5],
        'description': parts[6]
    }
