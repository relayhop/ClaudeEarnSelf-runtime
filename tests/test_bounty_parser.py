from src.parsers.bounty_parser import parse_bounty_line

def test_parse_bounty_line():
    line = '1548616\tbitcoin\t1000\t14\t16.1\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡'
    result = parse_bounty_line(line)
    assert result['id'] == 1548616
    assert result['currency'] == 'bitcoin'
    assert result['amount'] == 1000.0
    assert result['confirmations'] == 14
    assert result['fee_rate'] == 16.1
    assert result['status'] == 'OPEN_BOUNTY'
    assert 'Asking' in result['description']
