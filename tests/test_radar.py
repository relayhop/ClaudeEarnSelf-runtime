from datetime import datetime, time, timezone
import pytest

from tz_radar.parser import parse_row
from tz_radar.radar import is_asian_daytime, rank_opportunities


def test_asian_daytime_uses_local_zone():
    # 05:56 UTC is 14:56 in Seoul.
    when = datetime(2026, 9, 22, 5, 56, tzinfo=timezone.utc)
    assert is_asian_daytime(when, zones=("Asia/Seoul",))


def test_daytime_boundaries_and_validation():
    at_eight = datetime(2026, 1, 1, 23, tzinfo=timezone.utc)
    assert is_asian_daytime(at_eight, zones=("Asia/Seoul",), start=time(8), end=time(9))
    with pytest.raises(ValueError):
        is_asian_daytime(at_eight.replace(tzinfo=None))
    with pytest.raises(ValueError):
        is_asian_daytime(at_eight, zones=("Not/AZone",))
    with pytest.raises(ValueError):
        is_asian_daytime(at_eight, start=time(18), end=time(8))


def test_rank_is_score_descending_then_low_competition():
    first = "FRESH_LOW_COMP\tgithub\t2.3\t0\t0\thttps://github.com/a/issues/1\tt 2026-09-22T05:56"
    second = "FRESH_LOW_COMP\tgithub\t3.6\t0\t0\thttps://github.com/a/issues/2\tt 2026-09-22T04:43"
    assert [x.score for x in rank_opportunities([parse_row(first), parse_row(second)])] == [3.6, 2.3]


def test_rank_can_include_night_rows():
    row = "FRESH_LOW_COMP\tgithub\t1\t0\t0\thttps://github.com/a/issues/1\tt 2026-09-22T18:00"
    assert rank_opportunities([parse_row(row)]) == []
    assert len(rank_opportunities([parse_row(row)], daytime_only=False)) == 1
