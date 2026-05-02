import heapq

class RequestPriorityQueue:
    """
    Request queue using a priority queue data structure so high priority requests
    are handled first.
    """
    def __init__(self):
        self._queue = []
        self._index = 0

    def push(self, item, priority):
        # lower number = higher priority
        heapq.heappush(self._queue, (priority, self._index, item))
        self._index += 1

    def pop(self):
        if not self._queue:
            return None
        return heapq.heappop(self._queue)[-1]
        
    def qsize(self):
        return len(self._queue)
