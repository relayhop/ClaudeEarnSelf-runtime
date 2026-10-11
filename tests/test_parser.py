from datetime import datetime, timezone
import pytest

from tz_radar.parser import parse_row, parse_rows

ROW = "FRESH_LOW_COMP\tgithub\t2.3\t0\t0\thttps://github.com/relayhop/sn-monetization-runtime/issues/1153\t[radar] SN open bounty 2026-09-22T05:56"


def test_parse_real_radar_row():
    item = parse_row(ROW)
    assert item.score == 2.3
    assert item.is_github_issue
    assert item.observed_at == datetime(2026, 9, 22, 5, 56, tzinfo=timezone.utc)


def test_parse_rows_skips_blank_lines():
    assert len(parse_rows(["", ROW, "  "])) == 1


@pytest.mark.parametrize("bad", ["", "a\tb", "a\tb\tnope\t0\t0\thttps://x.test\tt"])
def test_rejects_malformed_rows(bad):
    with pytest.raises(ValueError):
        parse_row(bad)


def test_default_timestamp_is_normalized_to_utc():
    item = parse_row(ROW.replace("2026-09-22T05:56", "no-stamp"),
                     observed_at=datetime(2026, 9, 22, 1))
    assert item.observed_at.tzinfo == timezone.utc
