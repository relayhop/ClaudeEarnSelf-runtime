import pytest
from src.parsers.bounty_parser import parse_bounty_log, parse_bounty_logs, BountyRecord

def test_parse_standard_bounty_log():
    line = "1548616\tbitcoin\t1000\t15\t21.0\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡"
    record = parse_bounty_log(line)
    
    assert isinstance(record, BountyRecord)
    assert record.block_height == 1548616
    assert record.asset == "bitcoin"
    assert record.amount == 1000
    assert record.tier == 15
    assert record.value == 21.0
    assert record.status == "OPEN_BOUNTY"
    assert record.message == "Asking 🤔 the stackers ⚡"

def test_parse_log_with_tabs_in_message():
    line = "1548617\tbitcoin\t500\t10\t10.5\tOPEN_BOUNTY\tMessage with\ttabs"
    record = parse_bounty_log(line)
    assert record.message == "Message with\ttabs"

def test_parse_log_invalid_columns():
    with pytest.raises(ValueError, match="expected at least 7"):
        parse_bounty_log("1548616\tbitcoin\t1000")

def test_parse_log_invalid_types():
    with pytest.raises(ValueError, match="Type conversion failed"):
        parse_bounty_log("invalid\tbitcoin\t1000\t15\t21.0\tOPEN_BOUNTY\tMsg")

def test_parse_multiple_logs(caplog):
    lines = [
        "1548616\tbitcoin\t1000\t15\t21.0\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡",
        "",
        "bad\tdata",
        "1548617\tstacks\t2000\t20\t42.0\tCLOSED\tDone"
    ]
    records = parse_bounty_logs(lines)
    assert len(records) == 2
    assert records[0].asset == "bitcoin"
    assert records[1].asset == "stacks"
