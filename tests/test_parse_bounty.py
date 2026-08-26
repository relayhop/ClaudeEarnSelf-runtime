"""Tests for bounty parsing and tracking."""

import json
import tempfile
from pathlib import Path

import pytest

from src.parse_bounty import parse_bounty_line, process_bounty_text, load_bounties


class TestParseBountyLine:
    def test_valid_line_with_unicode(self):
        line = (
            "1549793\tbitcoin\t5000\t18\t20.5\t"
            "OPEN_BOUNTY,HOT\t\u26a1Best tips for running a profitable lighting node?\u26a1"
        )
        result = parse_bounty_line(line)
        assert result is not None
        assert result["id"] == 1549793
        assert result["currency"] == "bitcoin"
        assert result["amount"] == 5000
        assert result["replies"] == 18
        assert result["score"] == 20.5
        assert result["tags"] == ["OPEN_BOUNTY", "HOT"]
        assert result["status"] == "OPEN_BOUNTY"
        assert "\u26a1" not in result["title"]
        assert "\u26a1" in result["raw_title"]

    def test_empty_line(self):
        assert parse_bounty_line("") is None
        assert parse_bounty_line("   ") is None

    def test_missing_fields(self):
        assert parse_bounty_line("123\tbitcoin\t1000") is None

    def test_invalid_id(self):
        line = "abc\tbitcoin\t5000\t18\t20.5\tOPEN_BOUNTY\tTitle"
        assert parse_bounty_line(line) is None

    def test_invalid_amount(self):
        line = "123\tbitcoin\tabc\t18\t20.5\tOPEN_BOUNTY\tTitle"
        assert parse_bounty_line(line) is None

    def test_invalid_replies_defaults_to_zero(self):
        line = "123\tbitcoin\t5000\tabc\t20.5\tOPEN_BOUNTY\tTitle"
        result = parse_bounty_line(line)
        assert result is not None
        assert result["replies"] == 0

    def test_invalid_score_defaults_to_zero(self):
        line = "123\tbitcoin\t5000\t18\tabc\tOPEN_BOUNTY\tTitle"
        result = parse_bounty_line(line)
        assert result is not None
        assert result["score"] == 0.0

    def test_comma_separated_tags(self):
        line = "123\tbitcoin\t5000\t18\t20.5\tOPEN_BOUNTY,HOT,URGENT\tTitle"
        result = parse_bounty_line(line)
        assert result is not None
        assert result["tags"] == ["OPEN_BOUNTY", "HOT", "URGENT"]

    def test_no_open_bounty_tag(self):
        line = "123\tbitcoin\t5000\t18\t20.5\tCLOSED\tTitle"
        result = parse_bounty_line(line)
        assert result is not None
        assert result["status"] == "CLOSED"

    def test_extra_whitespace(self):
        line = "  123  \t  bitcoin  \t  5000  \t  18  \t  20.5  \t  OPEN_BOUNTY  \t  Title  "
        result = parse_bounty_line(line)
        assert result is not None
        assert result["id"] == 123
        assert result["currency"] == "bitcoin"
        assert result["title"] == "Title"


class TestProcessBountyText:
    def test_multi_line_processing(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.parse_bounty.BOUNTIES_FILE", tmp_path / "bounties.json")
        text = (
            "1549793\tbitcoin\t5000\t18\t20.5\t"
            "OPEN_BOUNTY,HOT\t\u26a1Best tips for running a profitable lighting node?\u26a1\n"
            "1549794\tbitcoin\t3000\t5\t10.0\tOPEN_BOUNTY\tAnother bounty"
        )
        added = process_bounty_text(text)
        assert len(added) == 2
        assert added[0]["id"] == 1549793
        assert added[1]["id"] == 1549794

    def test_duplicate_not_added(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.parse_bounty.BOUNTIES_FILE", tmp_path / "bounties.json")
        text = "123\tbitcoin\t5000\t18\t20.5\tOPEN_BOUNTY\tTitle"
        process_bounty_text(text)
        added = process_bounty_text(text)
        assert len(added) == 0

    def test_mixed_valid_invalid(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.parse_bounty.BOUNTIES_FILE", tmp_path / "bounties.json")
        text = (
            "invalid\tline\n"
            "123\tbitcoin\t5000\t18\t20.5\tOPEN_BOUNTY\tValid\n"
            "\n"
            "124\tbitcoin\t3000\t5\t10.0\tOPEN_BOUNTY\tAlso Valid"
        )
        added = process_bounty_text(text)
        assert len(added) == 2
