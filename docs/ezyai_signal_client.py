"""Push EzyAI autopilot signals to printezy.money's live board.

Drop this into the bot (tradernonymous/EzyAi) and call it from wherever the
autopilot already decides to open, move and close a trade. Nothing here is
specific to this file's location — it is a plain client for

    POST https://printezy.money/api/public/ezyai/signals

Standard library only, so it adds no dependency to the bot.

    export EZYAI_SIGNAL_KEY=...        # the same value set in Lovable Cloud
    export EZYMAP_SITE_URL=https://printezy.money   # optional, this is the default

Three calls cover the whole life of a trade, and every one of them is safe to
repeat: the site merges on `external_id`, so a retry after a crash updates the
card it already made rather than making a second one.

    open_signal("auto-8842", "XAUUSD", "buy",
                entry_low=4590.2, entry_high=4593.0, stop_price=4585.0,
                tp1=4604.0, tp2=4612.0, rr=2.4, setup_score=82,
                setup="London continuation", timeframe="M15")

    tick("auto-8842", 4597.1)          # as often as you like while it runs

    close_signal("auto-8842", "tp", result_r=2.4, result_pips=138)

None of these raise. A push that fails returns ok=False and logs — the website
board is a shop window, and it must never be able to take the bot down with it.
"""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.error
import urllib.request
from typing import Any

log = logging.getLogger(__name__)

DEFAULT_SITE = "https://printezy.money"
PATH = "/api/public/ezyai/signals"
TIMEOUT_S = 8
RETRIES = 3

#: The site rejects anything outside these, so fail loudly here instead.
STATUSES = ("pending", "running", "tp", "be", "sl", "cancelled")
DIRECTIONS = ("buy", "sell")


class PushResult(dict):
    """Truthy when the site accepted the push."""

    @property
    def ok(self) -> bool:
        return bool(self.get("ok"))


def _endpoint() -> str:
    return os.environ.get("EZYMAP_SITE_URL", DEFAULT_SITE).rstrip("/") + PATH


def _key() -> str:
    return os.environ.get("EZYAI_SIGNAL_KEY", "").strip()


def _check(signal: dict[str, Any]) -> str | None:
    """The three things the site will reject outright. None when it looks sound."""
    if not signal.get("external_id"):
        return "external_id is required"
    status = signal.get("status")
    if status is not None and status not in STATUSES:
        return f"status must be one of {', '.join(STATUSES)}"
    direction = signal.get("direction")
    if direction is not None and direction not in DIRECTIONS:
        return f"direction must be one of {', '.join(DIRECTIONS)}"
    return None


def push(**fields: Any) -> PushResult:
    """Send one signal payload, or a batch when called with signals=[...].

    Absent fields keep whatever the site already has.
    """
    key = _key()
    if not key:
        log.error("EZYAI_SIGNAL_KEY is not set — not pushing %s", fields.get("external_id"))
        return PushResult(ok=False, error="no key configured")

    # A batch carries its signals under `signals` and has no top-level id of
    # its own, so each entry is checked instead of the wrapper.
    batch = fields.get("signals")
    problems = (
        [_check(s) for s in batch] if isinstance(batch, list) else [_check(fields)]
    )
    for problem in problems:
        if problem:
            return PushResult(ok=False, error=problem)

    # Drop Nones so a partial update stays partial: sending null would clear the
    # column, which is not what "I have nothing new to say about this" means.
    body = json.dumps({k: v for k, v in fields.items() if v is not None}).encode()

    last_error = "unknown"
    for attempt in range(1, RETRIES + 1):
        request = urllib.request.Request(
            _endpoint(),
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "User-Agent": "EzyAi-autopilot/1.0",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
                payload = json.loads(response.read() or b"{}")
                log.info("pushed %s -> %s", fields.get("external_id"), response.status)
                return PushResult(ok=True, status=response.status, **payload)

        except urllib.error.HTTPError as error:
            detail = (error.read() or b"").decode(errors="replace")[:200]
            last_error = f"{error.code}: {detail}"
            # 401/403/400 will not improve by asking again; 5xx and 429 might.
            if error.code < 500 and error.code != 429:
                log.error("push rejected for %s — %s", fields.get("external_id"), last_error)
                return PushResult(ok=False, status=error.code, error=last_error)

        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = str(error)

        if attempt < RETRIES:
            time.sleep(2**attempt)  # 2s, 4s

    log.error("push failed for %s after %d tries — %s", fields.get("external_id"), RETRIES, last_error)
    return PushResult(ok=False, error=last_error)


def open_signal(
    external_id: str,
    symbol: str,
    direction: str,
    *,
    status: str = "pending",
    entry_low: float | None = None,
    entry_high: float | None = None,
    stop_price: float | None = None,
    tp1: float | None = None,
    tp2: float | None = None,
    rr: float | None = None,
    setup_score: int | None = None,
    setup: str | None = None,
    timeframe: str | None = None,
    note: str | None = None,
    opened_at: str | None = None,
) -> PushResult:
    """Put a new card on the board. `status="running"` if it filled immediately."""
    return push(
        external_id=external_id,
        symbol=symbol,
        direction=direction,
        status=status,
        entry_low=entry_low,
        entry_high=entry_high,
        stop_price=stop_price,
        tp1=tp1,
        tp2=tp2,
        rr=rr,
        setup_score=setup_score,
        setup=setup,
        timeframe=timeframe,
        note=note,
        opened_at=opened_at,
    )


def tick(external_id: str, last_price: float, *, status: str | None = None) -> PushResult:
    """Move the card's progress rail. Pass status="running" on the fill."""
    return push(external_id=external_id, last_price=last_price, status=status)


def close_signal(
    external_id: str,
    status: str,
    *,
    result_r: float | None = None,
    result_pips: float | None = None,
    last_price: float | None = None,
    closed_at: str | None = None,
) -> PushResult:
    """Take the card off the live board and into the track record.

    `status` is "tp", "be" or "sl". `result_r` is what every performance number
    is built from: +2.4 at target, -1 at stop, 0 at break-even. The site fills
    in closed_at itself if you leave it out.
    """
    return push(
        external_id=external_id,
        status=status,
        result_r=result_r,
        result_pips=result_pips,
        last_price=last_price,
        closed_at=closed_at,
    )


def push_many(signals: list[dict[str, Any]]) -> PushResult:
    """Up to 50 at once, for a reconcile sweep after downtime.

    Answers 207 when some landed and some did not; read `results` for the
    per-signal outcome rather than assuming all-or-nothing.
    """
    if not signals:
        return PushResult(ok=True, accepted=0, results=[])
    if len(signals) > 50:
        return PushResult(ok=False, error="at most 50 signals per request")
    return push(signals=signals)


if __name__ == "__main__":
    # A one-shot probe: proves the key and the endpoint, then removes itself
    # from the board by cancelling (cancelled signals never reach the history
    # and never count towards the win rate).
    logging.basicConfig(level=logging.INFO)
    probe = "probe-client-1"
    print(
        open_signal(
            probe,
            "XAUUSD",
            "buy",
            status="running",
            entry_low=4590.2,
            entry_high=4593.0,
            stop_price=4585.0,
            tp1=4604.0,
            rr=2.4,
            setup_score=80,
            setup="connectivity probe",
            timeframe="M15",
        )
    )
    print(tick(probe, 4597.1))
    print(push(external_id=probe, status="cancelled"))
