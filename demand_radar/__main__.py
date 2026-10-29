"""Main module entrypoint when invoked via python -m demand_radar."""

import sys
from .cli import main

if __name__ == "__main__":
    sys.exit(main())
