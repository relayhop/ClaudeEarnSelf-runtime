import re

BOUNTY_PATTERN = re.compile(
    r'^(?P<id>\d+)\t(?P<currency>\w+)\t(?P<amount>\d+)\t(?P<duration>\d+)\t(?P<score>[\d.]+)\t(?P<status>[A-Z_]+)\t(?P<description>.+)$',
    re.UNICODE
)

def parse_bounty_log(line):
    match = BOUNTY_PATTERN.match(line.strip())
    if not match:
        raise ValueError(f'Invalid bounty log line: {line}')
    return match.groupdict()
