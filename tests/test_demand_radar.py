"""Comprehensive verification suite for demand radar parser and prioritization engine."""

from decimal import Decimal
from pathlib import Path
import pytest

from demand_radar import (
    DemandSignal,
    calculate_rank_score,
    load_tsv_file,
    parse_payout_hint,
    parse_signal,
    parse_signals,
    prioritize_and_deduplicate,
)
from demand_radar.cli import main

LINE_STELLAR = "5\tgithub\t0.1\t10 USDC\tOPEN_ISSUE,LOW_COMP\thttps://github.com/Emmy123222/Stellar-MicroPay/issues/1111\tdocs: document Turrets DCA and stop-loss configuration with example JSON"
LINE_SN_1184 = "5\tgithub\t1.8\t000 SATS\tOPEN_ISSUE,LOW_COMP\thttps://github.com/relayhop/sn-monetization-runtime/issues/1184\t[radar] SN open bounty 2026-09-23T05:52"
LINE_SN_1183 = "5\tgithub\t2.4\t000 SATS\tOPEN_ISSUE,LOW_COMP\thttps://github.com/relayhop/sn-monetization-runtime/issues/1183\t[radar] SN open bounty 2026-09-23T05:13"


def test_parse_signal_exact_issue_1032_targets():
    """Verify parsing of signals directly present in Issue 1032."""
    signal_stellar = parse_signal(LINE_STELLAR)
    assert signal_stellar.score == 5
    assert signal_stellar.source == "github"
    assert signal_stellar.age_h == 0.1
    assert signal_stellar.payout_hint == "10 USDC"
    assert signal_stellar.reward_amount == Decimal("10")
    assert signal_stellar.currency == "USDC"
    assert signal_stellar.is_open is True
    assert signal_stellar.is_low_competition is True
    assert signal_stellar.is_high_priority is True
    assert signal_stellar.repo_name == "Emmy123222/Stellar-MicroPay"
    assert signal_stellar.issue_number == 1111
    assert signal_stellar.opportunity_key == "gh:Emmy123222/Stellar-MicroPay#1111"

    signal_sn = parse_signal(LINE_SN_1184)
    assert signal_sn.score == 5
    assert signal_sn.source == "github"
    assert signal_sn.age_h == 1.8
    assert signal_sn.currency == "SATS"
    assert signal_sn.is_open is True
    assert signal_sn.is_high_priority is True
    assert signal_sn.repo_name == "relayhop/sn-monetization-runtime"
    assert signal_sn.issue_number == 1184


def test_parse_payout_hint_variations():
    """Verify extraction of amounts and currencies across various syntax conventions."""
    assert parse_payout_hint("10 USDC") == (Decimal("10"), "USDC")
    assert parse_payout_hint("$20") == (Decimal("20"), "USD")
    assert parse_payout_hint("$10,000.50") == (Decimal("10000.50"), "USD")
    assert parse_payout_hint("0.09 USDC") == (Decimal("0.09"), "USDC")
    assert parse_payout_hint("10,000 SATS") == (Decimal("10000"), "SATS")
    assert parse_payout_hint("500 sats") == (Decimal("500"), "SATS")
    assert parse_payout_hint("-") == (None, "")
    assert parse_payout_hint("") == (None, "")


def test_parse_payout_hint_recovers_truncated_legacy_hint():
    """Verify that truncated 000 SATS hints are recovered when title has full amount."""
    title_with_reward = "10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"
    amount, currency = parse_payout_hint("000 SATS", fallback_text=title_with_reward)
    assert amount == Decimal("10000")
    assert currency == "SATS"


def test_parse_signals_skips_comments_and_blank_lines():
    """Ensure comment headers and whitespace rows are cleanly ignored."""
    raw = f"# score\tsource\tage_h\tpayout_hint\ttags\turl\ttitle\n\n{LINE_STELLAR}\n   \n"
    signals = parse_signals(raw)
    assert len(signals) == 1
    assert signals[0].issue_number == 1111


@pytest.mark.parametrize(
    "invalid_line",
    [
        "5\tgithub\t0.1\t10 USDC\tOPEN_ISSUE\thttps://github.com/a/b/issues/1",
        "five\tgithub\t0.1\t10 USDC\tOPEN_ISSUE\thttps://github.com/a/b/issues/1\ttitle",
        "-1\tgithub\t0.1\t10 USDC\tOPEN_ISSUE\thttps://github.com/a/b/issues/1\ttitle",
        "5\t\t0.1\t10 USDC\tOPEN_ISSUE\thttps://github.com/a/b/issues/1\ttitle",
        "5\tgithub\t-0.5\t10 USDC\tOPEN_ISSUE\thttps://github.com/a/b/issues/1\ttitle",
        "5\tgithub\t0.1\t10 USDC\tOPEN_ISSUE\thttp://insecure.test/issues/1\ttitle",
        "5\tgithub\t0.1\t10 USDC\tOPEN_ISSUE\tnot_a_url\ttitle",
        "5\tgithub\t0.1\t10 USDC\t\thttps://github.com/a/b/issues/1\ttitle",
        "5\tgithub\t0.1\t10 USDC\tOPEN_ISSUE\thttps://github.com/a/b/issues/1\t",
    ],
)
def test_parse_signal_rejects_malformed_inputs(invalid_line):
    """Verify validation boundaries reject corrupted records."""
    with pytest.raises(ValueError):
        parse_signal(invalid_line)


def test_prioritize_and_deduplicate_orders_and_dedupes():
    """Verify ranking and deduplication logic across multiple signals."""
    input_text = "\n".join([LINE_STELLAR, LINE_SN_1184, LINE_SN_1183])
    signals = parse_signals(input_text)
    prioritized = prioritize_and_deduplicate(signals)

    assert len(prioritized) == 3
    assert prioritized[0].issue_number == 1111
    assert calculate_rank_score(prioritized[0]) > calculate_rank_score(prioritized[1])

    duplicate_stellar = LINE_STELLAR.replace("0.1", "0.05")
    deduped = prioritize_and_deduplicate(parse_signals("\n".join([LINE_STELLAR, duplicate_stellar])))
    assert len(deduped) == 1
    assert deduped[0].age_h == 0.05


def test_load_real_snapshot_file():
    """Validate loading and parsing of the actual committed radar snapshot."""
    snapshot_path = Path("data/demand/demand_2026-09-23T07-40-13.tsv")
    assert snapshot_path.exists()

    signals = load_tsv_file(snapshot_path)
    assert len(signals) == 35

    high_priority = [s for s in signals if s.is_high_priority]
    assert len(high_priority) == 3
    assert {s.url for s in high_priority} == {
        "https://github.com/Emmy123222/Stellar-MicroPay/issues/1111",
        "https://github.com/relayhop/sn-monetization-runtime/issues/1184",
        "https://github.com/relayhop/sn-monetization-runtime/issues/1183",
    }


def test_cli_execution(capsys):
    """Test CLI execution mode with standard formatting and JSON serialization."""
    snapshot_path = "data/demand/demand_2026-09-23T07-40-13.tsv"

    exit_code = main([snapshot_path, "--high-priority-only"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "Loaded 35 signals, 3 deduplicated opportunities" in captured.out
    assert "Emmy123222/Stellar-MicroPay/issues/1111" in captured.out

    exit_code_json = main([snapshot_path, "--high-priority-only", "--json"])
    assert exit_code_json == 0
    captured_json = capsys.readouterr()
    assert '"issue_number": 1111' in captured_json.out
