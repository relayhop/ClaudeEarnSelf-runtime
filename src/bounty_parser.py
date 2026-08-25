import re

def parse_bounty_record(record: str) -> dict:
    """Parses a raw bounty record string into a structured dictionary.
    
    Example record:
    1548616\tbitcoin\t1000\t14\t15.7\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡
    """
    parts = record.strip().split('\t')
    if len(parts) < 7:
        raise ValueError(f"Invalid record format: expected at least 7 tab-separated fields, got {len(parts)}")
    
    try:
        bounty_id = int(parts[0])
        currency = parts[1]
        amount = int(parts[2])
        confirmations = int(parts[3])
        fee_rate = float(parts[4])
        status = parts[5]
        message = parts[6]
    except ValueError as e:
        raise ValueError(f"Type conversion failed for record: {record}") from e

    return {
        "id": bounty_id,
        "currency": currency,
        "amount": amount,
        "confirmations": confirmations,
        "fee_rate": fee_rate,
        "status": status,
        "message": message
    }
