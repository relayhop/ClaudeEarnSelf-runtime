import logging
from dataclasses import dataclass
from typing import List

logger = logging.getLogger(__name__)

@dataclass
class BountyRecord:
    """Represents a parsed Stacks Network (SN) bounty log entry."""
    block_height: int
    asset: str
    amount: int
    tier: int
    value: float
    status: str
    message: str

def parse_bounty_log(line: str) -> BountyRecord:
    """
    Parses a tab-separated SN OPEN_BOUNTY log line.
    
    Expected format:
    <block_height>\t<asset>\t<amount>\t<tier>\t<value>\t<status>\t<message...>
    
    Example:
    1548616\tbitcoin\t1000\t15\t21.0\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡
    """
    if not line or not isinstance(line, str):
        raise ValueError("Log line must be a non-empty string.")

    parts = line.rstrip('\n\r').split('\t')
    
    if len(parts) < 7:
        raise ValueError(
            f"Invalid bounty log format: expected at least 7 tab-separated columns, "
            f"got {len(parts)}. Line: {line!r}"
        )

    try:
        block_height = int(parts[0])
        asset = parts[1].strip()
        amount = int(parts[2])
        tier = int(parts[3])
        value = float(parts[4])
        status = parts[5].strip()
        # The message may contain tabs itself, so we join the remainder
        message = '\t'.join(parts[6:]).strip()
    except ValueError as e:
        raise ValueError(f"Type conversion failed for bounty log: {e}. Line: {line!r}") from e

    return BountyRecord(
        block_height=block_height,
        asset=asset,
        amount=amount,
        tier=tier,
        value=value,
        status=status,
        message=message
    )

def parse_bounty_logs(lines: List[str]) -> List[BountyRecord]:
    """Parses multiple lines, skipping empty lines and logging errors."""
    records = []
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        try:
            records.append(parse_bounty_log(line))
        except ValueError as e:
            logger.warning(f"Skipping invalid bounty log at line {i + 1}: {e}")
    return records
