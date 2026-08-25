import re
from dataclasses import dataclass

@dataclass
class Bounty:
    id: str
    asset: str
    amount: int
    duration: int
    rate: float
    status: str
    message: str

def parse_bounty(bounty_string: str) -> Bounty:
    parts = bounty_string.split('\t')
    if len(parts) < 7:
        raise ValueError(f'Invalid bounty format: {bounty_string}')
    
    asset = parts[1].upper()
    if asset == 'BITCOIN':
        asset = 'BTC'
        
    return Bounty(
        id=parts[0],
        asset=asset,
        amount=int(parts[2]),
        duration=int(parts[3]),
        rate=float(parts[4]),
        status=parts[5],
        message=parts[6]
    )
