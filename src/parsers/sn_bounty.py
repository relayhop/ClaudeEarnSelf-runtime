"""Parser for Stacker News (SN) OPEN_BOUNTY log entries."""

from typing import Dict, Any

def parse_sn_bounty_line(line: str) -> Dict[str, Any]:
    '''
    Parses a tab-separated SN bounty log line.
    Example: 1548616\tbitcoin\t1000\t14\t10.7\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡
    '''
    parts = line.strip().split('\t')
    if len(parts) < 7:
        raise ValueError(f'Invalid bounty log line, expected at least 7 tab-separated fields: {line}')

    try:
        return {
            'item_id': int(parts[0]),
            'network': parts[1],
            'amount': int(parts[2]),
            'block_height': int(parts[3]),
            'fee_rate': float(parts[4]),
            'status': parts[5],
            'description': parts[6]
        }
    except ValueError as e:
        raise ValueError(f'Type conversion failed for bounty log line: {line}') from e
