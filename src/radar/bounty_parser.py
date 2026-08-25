import sys
import json

def parse_bounty_line(line):
    parts = line.strip().split('\t')
    if len(parts) < 7:
        return None
    
    bounty_id, network, amount, blocks, score, status, message = parts
    
    if status != 'OPEN_BOUNTY':
        return None
        
    return {
        'id': int(bounty_id),
        'network': network,
        'amount': int(amount),
        'blocks': int(blocks),
        'score': float(score),
        'status': status,
        'message': message
    }

def process_bounties(file_path):
    bounties = []
    with open(file_path, 'r') as f:
        for line in f:
            bounty = parse_bounty_line(line)
            if bounty:
                bounties.append(bounty)
    return bounties

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python bounty_parser.py <file_path>')
        sys.exit(1)
    
    result = process_bounties(sys.argv[1])
    print(json.dumps(result, indent=2))