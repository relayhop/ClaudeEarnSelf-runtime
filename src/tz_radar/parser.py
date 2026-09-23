import re
from datetime import datetime, timezone
from typing import Iterable
from urllib.parse import urlparse

from .models import Opportunity

_STAMP = re.compile(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2})?(Z)?$")


def _parse_stamp(title: str, default: datetime | None) -> datetime:
    match = _STAMP.search(title)
    if match:
        value = datetime.fromisoformat(match.group(1)).replace(tzinfo=timezone.utc)
        return value
    if default is None:
        raise ValueError("row title must end with an ISO timestamp")
    if default.tzinfo is None:
        return default.replace(tzinfo=timezone.utc)
    return default.astimezone(timezone.utc)


def parse_row(line: str, *, observed_at: datetime | None = None) -> Opportunity:
    fields = line.rstrip("\r\n").split("\t")
    if len(fields) != 7:
        raise ValueError(f"expected 7 tab-separated fields, got {len(fields)}")
    category, source, score, competition, claims, url, title = fields
    if not category or not source or not title:
        raise ValueError("category, source, and title are required")
    try:
        parsed_score = float(score)
        parsed_competition = int(competition)
        parsed_claims = int(claims)
    except ValueError as exc:
        raise ValueError("score, competition, and claims must be numeric") from exc
    parsed_url = urlparse(url)
    if parsed_url.scheme != "https" or not parsed_url.netloc:
        raise ValueError("url must be an absolute HTTPS URL")
    return Opportunity(category, source, parsed_score, parsed_competition,
                       parsed_claims, url, title,
                       _parse_stamp(title, observed_at))


def parse_rows(lines: Iterable[str], *, observed_at: datetime | None = None) -> list[Opportunity]:
    return [parse_row(line, observed_at=observed_at) for line in lines if line.strip()]
