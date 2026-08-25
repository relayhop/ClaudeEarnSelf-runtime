import logging

def parse_bounty_log(line):
    parts = line.strip().split('\t')
    if len(parts) < 7:
        return None
    return {'id': parts[0], 'asset': parts[1], 'amount': parts[2], 'status': parts[5], 'message': '\t'.join(parts[6:])}