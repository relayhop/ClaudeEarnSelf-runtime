from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class Opportunity:
    category: str
    source: str
    score: float
    competition: int
    claims: int
    url: str
    title: str
    observed_at: datetime

    @property
    def is_github_issue(self) -> bool:
        return self.source.lower() == "github" and "/issues/" in self.url
