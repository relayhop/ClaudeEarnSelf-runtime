from decimal import Decimal

import pytest

from demand_radar import parse_signal, parse_signals, prioritize


LINE = "5\tgithub\t0.8\tSATS\tOPEN_ISSUE,LOW_COMP\thttps://github.com/relayhop/sn-monetization-runtime/issues/1153\t[radar] SN open bounty 2026-09-22T05:56"


def test_parse_signal_normalizes_record():
    signal = parse_signal(LINE)
    assert signal.rank == 5
    assert signal.reward_sats == Decimal("0.8")
    assert signal.status == ("OPEN_ISSUE", "LOW_COMP")
    assert signal.captured_at == "2026-09-22T05:56"
    assert signal.is_open and signal.is_low_competition


def test_parse_signals_skips_blank_lines_and_reports_line_number():
    assert len(parse_signals("\n" + LINE + "\n")) == 1
    with pytest.raises(ValueError, match=r"line 2"):
        parse_signals("\nnot\tvalid")


@pytest.mark.parametrize("bad", [
    LINE.replace("0.8", "-1"),
    LINE.replace("https://github.com/relayhop/sn-monetization-runtime/issues/1153", "http://evil.test/x"),
    LINE.replace("OPEN_ISSUE,LOW_COMP", ""),
    LINE.replace("5\tgithub", "nope\tgithub"),
])
def test_parse_rejects_invalid_or_unsafe_records(bad):
    with pytest.raises(ValueError):
        parse_signal(bad)


def test_prioritize_filters_and_deduplicates_by_best_score():
    duplicate = LINE.replace("0.8", "2.0")
    closed = LINE.replace("OPEN_ISSUE,LOW_COMP", "CLOSED,LOW_COMP")
    result = prioritize(parse_signals("\n".join([LINE, duplicate, closed])))
    assert len(result) == 1
    assert result[0].reward_sats == Decimal("2.0")


def test_prioritize_orders_by_actionable_score_then_url():
    second = LINE.replace("1153", "1150").replace("0.8", "2.0")
    result = prioritize(parse_signals(LINE + "\n" + second))
    assert [item.url.rsplit("/", 1)[-1] for item in result] == ["1150", "1153"]
