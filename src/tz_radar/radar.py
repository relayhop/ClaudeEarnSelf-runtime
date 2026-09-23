from datetime import datetime, time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .models import Opportunity

DEFAULT_ZONES = ("Asia/Seoul", "Asia/Tokyo", "Asia/Singapore", "Asia/Kolkata")


def _validate_zones(zones: tuple[str, ...]) -> None:
    for name in zones:
        try:
            ZoneInfo(name)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"unknown timezone: {name}") from exc


def is_asian_daytime(when: datetime, *, zones: tuple[str, ...] = DEFAULT_ZONES,
                     start: time = time(8), end: time = time(18)) -> bool:
    if when.tzinfo is None:
        raise ValueError("when must be timezone-aware")
    if start >= end:
        raise ValueError("daytime start must be before end")
    _validate_zones(zones)
    return any(start <= when.astimezone(ZoneInfo(zone)).time().replace(tzinfo=None) < end
               for zone in zones)


def rank_opportunities(opportunities: list[Opportunity], *,
                       zones: tuple[str, ...] = DEFAULT_ZONES,
                       daytime_only: bool = True) -> list[Opportunity]:
    selected = [item for item in opportunities
                if (not daytime_only or is_asian_daytime(item.observed_at, zones=zones))]
    return sorted(selected, key=lambda item: (-item.score, item.competition,
                                               item.claims, -item.observed_at.timestamp()))
