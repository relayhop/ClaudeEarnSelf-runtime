"""Opportunity prioritization, scoring, and cross-channel deduplication."""

from decimal import Decimal
from typing import Iterable

from .models import DemandSignal


def calculate_rank_score(signal: DemandSignal) -> Decimal:
    """Calculate an objective, deterministic ranking metric for a demand signal.

    Parameters
    ----------
    signal : DemandSignal
        The candidate demand opportunity to evaluate.

    Returns
    -------
    Decimal
        The composite priority score.
    """
    score = Decimal(signal.score * 20)
    if signal.is_high_priority:
        score += Decimal("50")
    if signal.is_open:
        score += Decimal("30")
    if signal.is_low_competition:
        score += Decimal("20")

    if signal.reward_amount is not None and signal.reward_amount > 0:
        if signal.currency in ("SATS", "SAT"):
            score += signal.reward_amount / Decimal("100")
        elif signal.currency in ("USDC", "USDT", "USD"):
            score += signal.reward_amount * Decimal("10")
        else:
            score += signal.reward_amount

    freshness_penalty = Decimal(str(min(signal.age_h, 48.0)))
    score -= freshness_penalty
    return score


def prioritize_and_deduplicate(
    signals: Iterable[DemandSignal],
    *,
    high_priority_only: bool = False,
) -> list[DemandSignal]:
    """Filter, deduplicate by canonical opportunity, and rank demand signals.

    Parameters
    ----------
    signals : Iterable[DemandSignal]
        Raw list of demand signals to process.
    high_priority_only : bool, optional
        Filter out items that do not meet high-priority threshold criteria.

    Returns
    -------
    list[DemandSignal]
        Deduplicated and prioritized demand opportunities.
    """
    best_by_key: dict[str, DemandSignal] = {}

    for signal in signals:
        if high_priority_only and not signal.is_high_priority:
            continue

        key = signal.opportunity_key
        existing = best_by_key.get(key)
        if existing is None:
            best_by_key[key] = signal
        else:
            existing_score = calculate_rank_score(existing)
            new_score = calculate_rank_score(signal)
            if new_score > existing_score or (new_score == existing_score and signal.age_h < existing.age_h):
                best_by_key[key] = signal

    deduped = list(best_by_key.values())
    return sorted(
        deduped,
        key=lambda item: (-calculate_rank_score(item), item.age_h, item.url),
    )
