"""Coalesce status reads within one worker, retaining only active streams.

No poll task or terminal-job cache survives the last viewer. Database reads
still apply the timeout watchdog on every refresh.
"""

import asyncio
import time
from app.services import db_service


class SharedStatus:
    def __init__(self):
        self.viewers = 0
        self.lock = asyncio.Lock()
        self.record = None
        self.read_at = float("-inf")

    async def read(self, request_id: str, interval: float):
        async with self.lock:
            if time.monotonic() - self.read_at >= interval:
                self.record = await db_service.get_request(request_id)
                self.read_at = time.monotonic()
            return self.record


_active: dict[str, SharedStatus] = {}


def acquire(request_id: str):
    shared = _active.setdefault(request_id, SharedStatus())
    shared.viewers += 1
    released = False

    def release():
        nonlocal released
        if released:
            return
        released = True
        shared.viewers -= 1
        if not shared.viewers and _active.get(request_id) is shared:
            del _active[request_id]

    return shared, release
