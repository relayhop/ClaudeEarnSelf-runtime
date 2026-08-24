import json
import os

def ingest_sn_bounty(raw_data: str):
    parts = raw_data.split('\t')
    if len(parts) != 7:
        raise ValueError("Invalid bounty format")
    
    bounty = {
        "id": parts[0],
        "platform": parts[1],
        "amount": int(parts[2]),
        "threshold": int(parts[3]),
        "rate": float(parts[4]),
        "status": parts[5],
        "title": parts[6]
    }
    
    filepath = "data/bounties.json"
    os.makedirs("data", exist_ok=True)
    if not os.path.exists(filepath):
        with open(filepath, "w") as f:
            json.dump([], f)
            
    with open(filepath, "r+") as f:
        data = json.load(f)
        data.append(bounty)
        f.seek(0)
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    raw = "1548616\tbitcoin\t1000\t15\t22.0\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡"
    ingest_sn_bounty(raw)
