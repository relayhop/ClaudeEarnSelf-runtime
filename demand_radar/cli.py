"""Command-line interface for the demand radar evaluation tool."""

import argparse
import json
from pathlib import Path
import sys

from .parser import load_tsv_file
from .radar import calculate_rank_score, prioritize_and_deduplicate


def main(argv: list[str] | None = None) -> int:
    """Execute command-line processing of demand radar snapshots.

    Parameters
    ----------
    argv : list[str], optional
        List of command-line arguments. Defaults to sys.argv[1:].

    Returns
    -------
    int
        Exit status code.
    """
    parser = argparse.ArgumentParser(
        description="Parse, prioritize, and deduplicate demand radar opportunities."
    )
    parser.add_argument("tsv_file", type=Path, help="Path to demand radar TSV file")
    parser.add_argument(
        "--high-priority-only",
        action="store_true",
        help="Only display signals meeting high-priority criteria",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output structured JSON records instead of summary table",
    )
    args = parser.parse_args(argv)

    if not args.tsv_file.exists():
        parser.error(f"Target file does not exist: {args.tsv_file}")

    signals = load_tsv_file(args.tsv_file)
    prioritized = prioritize_and_deduplicate(
        signals, high_priority_only=args.high_priority_only
    )

    if args.json:
        payload = [
            {
                **item.to_dict(),
                "rank_score": str(calculate_rank_score(item)),
            }
            for item in prioritized
        ]
        print(json.dumps(payload, indent=2))
        return 0

    print(f"Loaded {len(signals)} signals, {len(prioritized)} deduplicated opportunities:\n")
    for item in prioritized:
        score = calculate_rank_score(item)
        print(
            f"[{score:6.1f}] ({item.score}) {item.payout_hint:12s} {item.source:12s} "
            f"{item.age_h:4.1f}h  {item.url}\n  -> {item.title}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
