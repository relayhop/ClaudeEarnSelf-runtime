def parse_bounty_line(line: str) -> dict:
    parts = line.strip().split('\t')
    if len(parts) < 7:
        raise ValueError('Invalid bounty line format')
    return {
        'id': int(parts[0]),
        'currency': parts[1],
        'amount': float(parts[2]),
        'confirmations': int(parts[3]),
        'fee_rate': float(parts[4]),
        'status': parts[5],
        'description': parts[6]
    }
