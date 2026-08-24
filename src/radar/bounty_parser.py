import logging

logger = logging.getLogger(__name__)

def parse_radar_bounty(raw_line: str) -> dict:
    parts = raw_line.strip().split('\t')
    if len(parts) < 7 or parts[5] != 'OPEN_BOUNTY':
        return None
    try:
        return {
            'id': int(parts[0]),
            'asset': parts[1],
            'amount': float(parts[2]),
            'confirmations': int(parts[3]),
            'rate': float(parts[4]),
            'status': parts[5],
            'message': parts[6]
        }
    except ValueError as e:
        logger.error(f'Parse error: {e}')
        return None
