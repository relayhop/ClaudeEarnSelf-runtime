"""Data processing utilities.

Refactored to use list comprehensions instead of explicit for loops
for better performance and readability.
"""

def process_items(items: list) -> list:
    """Process a list of items and return transformed results.

    Replaces explicit `for l in items` loops with list comprehensions
    as per standard coding guidelines.
    """
    if not items:
        return []
    
    return [item.strip().lower() for item in items if item is not None]

def filter_active_records(records: list) -> list:
    """Filter active records using comprehension instead of for loop."""
    return [r for r in records if r.get("is_active", False)]
