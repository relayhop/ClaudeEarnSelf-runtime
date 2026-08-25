from src.parsers.bounty_parser import parse_bounty_log

def test_parse_bounty_log_with_emojis():
    line = '1548616\tbitcoin\t1000\t14\t9.6\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡'
    result = parse_bounty_log(line)
    assert result['id'] == '1548616'
    assert result['currency'] == 'bitcoin'
    assert result['amount'] == '1000'
    assert result['duration'] == '14'
    assert result['score'] == '9.6'
    assert result['status'] == 'OPEN_BOUNTY'
    assert result['description'] == 'Asking 🤔 the stackers ⚡'
