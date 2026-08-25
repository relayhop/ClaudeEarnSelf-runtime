from dataclasses import dataclass
from typing import Optional

@dataclass
class SNOpenBounty:
    id: int
    network: str
    amount: int
    unknown_metric: int
    rate: float
    status: str
    description: str

def parse_sn_open_bounty(line: str) -> Optional[SNOpenBounty]:
    '''
    Parses a line representing a new SN OPEN_BOUNTY.
    Example:
    1548616	bitcoin	1000	14	10.7	OPEN_BOUNTY	Asking 🤔 the stackers ⚡
    '''
    if not line or not line.strip():
        return None
    
    parts = line.strip().split('	')
    if len(parts) < 6:
        raise ValueError(f'Invalid bounty line format: expected at least 6 tab-separated values, got {len(parts)}')
        
    description = '	'.join(parts[6:]) if len(parts) > 6 else ''
    
    try:
        return SNOpenBounty(
            id=int(parts[0]),
            network=str(parts[1]),
            amount=int(parts[2]),
            unknown_metric=int(parts[3]),
            rate=float(parts[4]),
            status=str(parts[5]),
            description=description
        )
    except (ValueError, IndexError) as e:
        raise ValueError(f'Failed to parse bounty line: {line}') from e