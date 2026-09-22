import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

from .models import DemandSignal

_URL_RE = re.compile(r"^https://github\.com/[^/\s]+/[^/\s]+/issues/\d+$")


def _money(value: str) -> Decimal:
    raw = value.strip().replace(",", "")
    if not raw:
        raise ValueError("reward is required")
    try:
        amount = Decimal(raw)
    except InvalidOperation as exc:
        raise ValueError("reward must be numeric") from exc
    if amount < 0:
        raise ValueError("reward cannot be negative")
    return amount


def parse_signal(line: str) -> DemandSignal:
    """Parse one radar TSV record; reject malformed or unsafe records."""
    fields = [part.strip() for part in line.strip().split("\t")]
    if len(fields) != 7:
        raise ValueError("expected 7 tab-separated fields")
    rank, source, reward, currency, statuses, url, title = fields
    try:
        rank_value = int(rank)
    except ValueError as exc:
        raise ValueError("rank must be an integer") from exc
    if rank_value < 0:
        raise ValueError("rank cannot be negative")
    if not source:
        raise ValueError("source is required")
    if not currency or not re.fullmatch(r"[A-Z0-9]{3,8}", currency):
        raise ValueError("currency must be an uppercase code")
    if not _URL_RE.fullmatch(url) or urlparse(url).scheme != "https":
        raise ValueError("url must be a canonical GitHub issue URL")
    if not title:
        raise ValueError("title is required")
    status = tuple(item for item in (s.strip() for s in statuses.split(",")) if item)
    if not status:
        raise ValueError("at least one status is required")
    match = re.search(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$", title)
    captured_at = match.group(1) if match else ""
    return DemandSignal(rank_value, source, _money(reward), currency, status, url, title, captured_at)


def parse_signals(text: str) -> list[DemandSignal]:
    """Parse non-empty lines, preserving input order."""
    signals = []
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip():
            continue
        try:
            signals.append(parse_signal(line))
        except ValueError as exc:
            raise ValueError(f"line {number}: {exc}") from exc
    return signals
