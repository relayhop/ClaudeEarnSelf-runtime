from decimal import Decimal

from .models import DemandSignal


def _score(signal: DemandSignal) -> Decimal:
    """Stable, explainable score: reward first, then explicit demand quality."""
    score = signal.reward_sats
    if signal.is_open:
        score += Decimal("100")
    if signal.is_low_competition:
        score += Decimal("25")
    score += Decimal(max(0, signal.rank))
    return score


def prioritize(signals: list[DemandSignal]) -> list[DemandSignal]:
    """Keep actionable open/low-competition records and deduplicate by issue URL."""
    best: dict[str, DemandSignal] = {}
    for signal in signals:
        if not signal.is_open or not signal.is_low_competition:
            continue
        previous = best.get(signal.url)
        if previous is None or (_score(signal), signal.title) > (_score(previous), previous.title):
            best[signal.url] = signal
    return sorted(best.values(), key=lambda item: (-_score(item), item.url))
