from dataclasses import dataclass
from typing import List

@dataclass
class Bounty:
    id: int
    asset: str
    amount: int
    duration_days: int = 0
    rate: float = 0.0
    bounty_type: str = ""
    description: str = ""

    @classmethod
    def from_tsv(cls, line: str) -> 'Bounty':
        parts = line.strip().split('\t')
        if len(parts) < 7:
            raise ValueError(f'Expected at least 7 columns, got {len(parts)}: {line}')
        
        return cls(
            id=int(parts[0]),
            asset=str(parts[1]),
            amount=int(parts[2]),
            duration_days=int(parts[3]),
            rate=float(parts[4]),
            bounty_type=str(parts[5]),
            description=str(parts[6])
        )

    def is_open_bounty(self) -> bool:
        return self.bounty_type == 'OPEN_BOUNTY'

def parse_bounties(lines: List[str]) -> List[Bounty]:
    return [Bounty.from_tsv(line) for line in lines if line.strip()]
