import time
from collections import deque

class TokenBucketRateLimiter:
    """
    Rate limiting implemented using Token Bucket Algorithm which is the most optimal
    algorithm for handling traffic bursts without blocking legitimate users.
    """
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate
        self.last_refill_timestamp = time.time()

    def allow_request(self, tokens_needed=1):
        now = time.time()
        time_passed = now - self.last_refill_timestamp
        self.tokens = min(self.capacity, self.tokens + time_passed * self.refill_rate)
        self.last_refill_timestamp = now
        
        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False

class SlidingWindowIPRateLimiter:
    """
    IP based rate limiting using sliding window algorithm so no single IP can send
    more than 10 requests per minute.
    """
    def __init__(self, limit=10, window_size=60):
        self.limit = limit
        self.window_size = window_size
        self.ip_requests = {}

    def allow_request(self, ip):
        now = time.time()
        if ip not in self.ip_requests:
            self.ip_requests[ip] = deque()
        
        # Remove requests outside the window
        while self.ip_requests[ip] and self.ip_requests[ip][0] <= now - self.window_size:
            self.ip_requests[ip].popleft()
            
        if len(self.ip_requests[ip]) < self.limit:
            self.ip_requests[ip].append(now)
            return True
        return False
