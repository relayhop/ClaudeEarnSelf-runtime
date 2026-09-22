import argparse
import sys

from .parser import parse_rows
from .radar import rank_opportunities


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Rank timezone-aware radar rows")
    parser.add_argument("--all-hours", action="store_true", help="include non-daytime rows")
    args = parser.parse_args(argv)
    try:
        rows = parse_rows(sys.stdin)
        for item in rank_opportunities(rows, daytime_only=not args.all_hours):
            print(f"{item.score:g}\t{item.observed_at.isoformat()}\t{item.url}\t{item.title}")
    except ValueError as exc:
        parser.error(str(exc))
    return 0
