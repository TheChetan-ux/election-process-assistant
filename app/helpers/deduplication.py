import hashlib
import asyncio

class RequestDeduplicator:
    def __init__(self):
        self.ongoing_requests = {}
        self._lock = asyncio.Lock()

    async def execute(self, key_data: str, coro_func, *args, **kwargs):
        key = hashlib.sha256(key_data.encode()).hexdigest()
        
        async with self._lock:
            if key in self.ongoing_requests:
                # Wait for the ongoing request to complete
                future = self.ongoing_requests[key]
                return await future
            else:
                # Create a future for this new request
                future = asyncio.Future()
                self.ongoing_requests[key] = future

        try:
            # Execute the actual coroutine
            result = await coro_func(*args, **kwargs)
            future.set_result(result)
            return result
        except Exception as e:
            future.set_exception(e)
            raise e
        finally:
            async with self._lock:
                del self.ongoing_requests[key]

deduplicator = RequestDeduplicator()
