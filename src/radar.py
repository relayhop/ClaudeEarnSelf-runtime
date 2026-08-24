def parse_radar_issue(description):
    lines = description.strip().split('\n')
    for line in lines:
        parts = line.split('\t')
        if len(parts) >= 6 and parts[5] == 'OPEN_BOUNTY':
            return {
                'id': parts[0],
                'asset': parts[1],
                'status': parts[5],
                'message': parts[6] if len(parts) > 6 else ''
            }
    return None
