"""TSV record parser and data normalizer for demand radar opportunities."""

from decimal import Decimal, InvalidOperation
from pathlib import Path
import re
from urllib.parse import urlparse

from .models import DemandSignal

_CURRENCY_PATTERNS = [
    (re.compile(r"^\$\s*([0-9,]+(?:\.[0-9]+)?)$"), "USD"),
    (re.compile(r"^€\s*([0-9,]+(?:\.[0-9]+)?)$"), "EUR"),
    (re.compile(r"^£\s*([0-9,]+(?:\.[0-9]+)?)$"), "GBP"),
    (re.compile(r"^([0-9,]+(?:\.[0-9]+)?)\s*(USDC|USDT|USD|SATS?|ETH|BTC)$", re.IGNORECASE), None),
]

_FALLBACK_RECOVERY = re.compile(
    r"\b(\d{1,3}(?:,\d{3})+|\d+)\s*(SATS?|USDC|USDT|USD|ETH|BTC)\b",
    re.IGNORECASE,
)


def parse_payout_hint(hint: str, fallback_text: str = "") -> tuple[Decimal | None, str]:
    """Extract numeric value and normalized currency symbol from raw payout strings.

    Parameters
    ----------
    hint : str
        The raw payout hint string recorded from radar telemetry.
    fallback_text : str, optional
        Supplementary contextual text (e.g. title) used to reconstruct truncated values.

    Returns
    -------
    tuple[Decimal | None, str]
        Normalized numeric amount and standard currency code.
    """
    clean_hint = hint.strip()
    if not clean_hint or clean_hint == "-":
        return None, ""

    if clean_hint.upper() == "000 SATS" and fallback_text:
        match = _FALLBACK_RECOVERY.search(fallback_text)
        if match:
            raw_num = match.group(1).replace(",", "")
            curr = match.group(2).upper()
            if curr == "SAT":
                curr = "SATS"
            try:
                return Decimal(raw_num), curr
            except InvalidOperation:
                pass

    for pattern, currency_override in _CURRENCY_PATTERNS:
        match = pattern.match(clean_hint)
        if match:
            raw_amount = match.group(1).replace(",", "")
            curr = currency_override if currency_override else match.group(2).upper()
            if curr == "SAT":
                curr = "SATS"
            try:
                amount = Decimal(raw_amount)
                if amount < 0:
                    raise ValueError(f"payout amount cannot be negative: {amount}")
                return amount, curr
            except InvalidOperation as exc:
                raise ValueError(f"malformed numeric amount: {clean_hint}") from exc

    numeric_match = re.search(r"(\d+(?:\.\d+)?)", clean_hint)
    if numeric_match:
        try:
            return Decimal(numeric_match.group(1)), "UNKNOWN"
        except InvalidOperation:
            pass

    return None, clean_hint


def parse_signal(line: str) -> DemandSignal:
    """Parse and strictly validate a single seven-column TSV radar line.

    Parameters
    ----------
    line : str
        A single tab-separated record from a demand radar TSV file.

    Returns
    -------
    DemandSignal
        The validated immutable signal structure.

    Raises
    ------
    ValueError
        If the record does not satisfy schema, boundary, or security requirements.
    """
    fields = [field.strip() for field in line.rstrip("\r\n").split("\t")]
    if len(fields) != 7:
        raise ValueError(f"expected 7 tab-separated fields, got {len(fields)}: {line!r}")

    raw_score, source, raw_age, payout_hint, raw_tags, url, title = fields

    try:
        score = int(raw_score)
    except ValueError as exc:
        raise ValueError(f"score must be an integer, got {raw_score!r}") from exc
    if score < 0:
        raise ValueError(f"score cannot be negative: {score}")

    if not source:
        raise ValueError("source cannot be empty")

    try:
        age_h = float(raw_age)
    except ValueError as exc:
        raise ValueError(f"age_h must be a float, got {raw_age!r}") from exc
    if age_h < 0:
        raise ValueError(f"age_h cannot be negative: {age_h}")

    if not url:
        raise ValueError("url cannot be empty")
    parsed_url = urlparse(url)
    if parsed_url.scheme != "https" or not parsed_url.netloc:
        raise ValueError(f"url must be a secure absolute HTTPS link: {url!r}")

    if not title:
        raise ValueError("title cannot be empty")

    tags = tuple(tag.strip() for tag in raw_tags.split(",") if tag.strip())
    if not tags:
        raise ValueError("record must have at least one valid tag")

    reward_amount, currency = parse_payout_hint(payout_hint, fallback_text=title)

    return DemandSignal(
        score=score,
        source=source,
        age_h=age_h,
        payout_hint=payout_hint,
        tags=tags,
        url=url,
        title=title,
        reward_amount=reward_amount,
        currency=currency,
    )


def parse_signals(text: str) -> list[DemandSignal]:
    """Parse multiple TSV lines, skipping comments and blank lines.

    Parameters
    ----------
    text : str
        Multi-line text containing TSV radar records.

    Returns
    -------
    list[DemandSignal]
        Parsed and validated demand signals.
    """
    signals = []
    for line_num, line in enumerate(text.splitlines(), start=1):
        clean = line.strip()
        if not clean or clean.startswith("#"):
            continue
        try:
            signals.append(parse_signal(line))
        except ValueError as exc:
            raise ValueError(f"line {line_num}: {exc}") from exc
    return signals


def load_tsv_file(file_path: str | Path) -> list[DemandSignal]:
    """Read a radar snapshot TSV file from disk and parse all contained signals.

    Parameters
    ----------
    file_path : str or Path
        Filesystem path to the TSV file.

    Returns
    -------
    list[DemandSignal]
        Parsed demand signals from the target file.
    """
    content = Path(file_path).read_text(encoding="utf-8")
    return parse_signals(content)
