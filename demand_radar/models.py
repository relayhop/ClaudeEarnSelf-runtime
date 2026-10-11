from dataclasses import dataclass
from decimal import Decimal
from typing import Tuple


@dataclass(frozen=True)
class DemandSignal:
    """A validated demand opportunity from a public radar source."""

    rank: int
    source: str
    reward_sats: Decimal
    currency: str
    status: Tuple[str, ...]
    url: str
    title: str
    captured_at: str

    @property
    def is_open(self) -> bool:
        return "OPEN_ISSUE" in self.status

    @property
    def is_low_competition(self) -> bool:
        return "LOW_COMP" in self.status
