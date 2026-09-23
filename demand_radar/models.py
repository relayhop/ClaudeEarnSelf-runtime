"""Data representations for parsed demand-side radar signals."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Tuple
import re
from urllib.parse import urlparse


@dataclass(frozen=True)
class DemandSignal:
    """Represents a validated, structured demand signal detected by radar."""

    score: int
    source: str
    age_h: float
    payout_hint: str
    tags: Tuple[str, ...]
    url: str
    title: str
    reward_amount: Decimal | None
    currency: str

    @property
    def is_open(self) -> bool:
        """Indicate whether the opportunity is currently active and open."""
        return any(tag in self.tags for tag in ("OPEN_ISSUE", "OPEN_NEED", "BOUNTY"))

    @property
    def is_low_competition(self) -> bool:
        """Indicate whether the opportunity has minimal competing proposals."""
        return "LOW_COMP" in self.tags

    @property
    def is_high_priority(self) -> bool:
        """Determine whether the signal meets high-priority threshold criteria."""
        return self.score >= 5 and self.age_h <= 4.0

    @property
    def repo_name(self) -> str | None:
        """Extract owner and repository name for GitHub issues."""
        parsed = urlparse(self.url)
        if parsed.netloc == "github.com":
            match = re.match(r"^/([^/]+/[^/]+)/issues/\d+$", parsed.path)
            if match:
                return match.group(1)
        return None

    @property
    def issue_number(self) -> int | None:
        """Extract numeric issue identifier for GitHub issues."""
        parsed = urlparse(self.url)
        if parsed.netloc == "github.com":
            match = re.match(r"^/[^/]+/[^/]+/issues/(\d+)$", parsed.path)
            if match:
                return int(match.group(1))
        return None

    @property
    def opportunity_key(self) -> str:
        """Provide a canonical deduplication key for underlying target bounties."""
        sn_match = re.search(r"\b(?:item|bounty|SN)?\s*#?(\d{7})\b", self.title + " " + self.url)
        if sn_match:
            return f"sn:{sn_match.group(1)}"
        if self.repo_name and self.issue_number is not None:
            return f"gh:{self.repo_name}#{self.issue_number}"
        return f"url:{self.url}"

    def to_dict(self) -> dict[str, Any]:
        """Convert the signal instance to a serializable dictionary representation."""
        return {
            "score": self.score,
            "source": self.source,
            "age_h": self.age_h,
            "payout_hint": self.payout_hint,
            "tags": list(self.tags),
            "url": self.url,
            "title": self.title,
            "reward_amount": str(self.reward_amount) if self.reward_amount is not None else None,
            "currency": self.currency,
            "is_open": self.is_open,
            "is_low_competition": self.is_low_competition,
            "is_high_priority": self.is_high_priority,
            "repo_name": self.repo_name,
            "issue_number": self.issue_number,
            "opportunity_key": self.opportunity_key,
        }
