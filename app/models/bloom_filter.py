import hashlib
import re
import zlib
import math

class BloomFilter:
    """
    Memory-Optimized Bloom Filter strictly limited to a specific byte size (e.g., 1MB).
    Utilizes double-hashing to simulate k hash functions without external libraries.
    """
    def __init__(self, size_mb: int = 1, expected_elements: int = 1_000_000):
        # 1MB limit -> 1,048,576 bytes -> 8,388,608 bits
        self.byte_size = size_mb * 1024 * 1024
        self.bit_size = self.byte_size * 8
        self.bit_array = bytearray(self.byte_size)
        
        # Calculate optimal k (number of hash functions)
        k = (self.bit_size / expected_elements) * math.log(2)
        self.hash_count = max(1, int(k))
        
        # Voter ID Regex Pattern (e.g. ABC1234567)
        self.pattern = re.compile(r'^[A-Z]{3}\d{7}$')

    def _hash1(self, item: str) -> int:
        """First hash function using MD5."""
        return int(hashlib.md5(item.encode('utf-8')).hexdigest(), 16)

    def _hash2(self, item: str) -> int:
        """Second hash function using SHA1."""
        return int(hashlib.sha1(item.encode('utf-8')).hexdigest(), 16)

    def _get_k_hashes(self, item: str):
        """ Double-hashing technique: hash_i = (hash1 + i * hash2) % bit_size """
        h1 = self._hash1(item)
        h2 = self._hash2(item)
        for i in range(self.hash_count):
            yield (h1 + i * h2) % self.bit_size

    def add(self, item: str):
        """Adds a Voter ID to the bit array."""
        for index in self._get_k_hashes(item):
            byte_idx = index // 8
            bit_idx = index % 8
            self.bit_array[byte_idx] |= (1 << bit_idx)

    def check(self, item: str, json_content_layer: set = None) -> bool:
        """
        Checks if Voter ID is valid based on pattern matching and the Bloom filter.
        Includes a secondary "Catch-All" check to resolve potential false positives 
        if the exact verified dataset is provided.
        """
        # Step 1: Structural pattern validation
        if not self.pattern.match(item):
            return False

        # Step 2: Probabilistic Bloom check
        for index in self._get_k_hashes(item):
            byte_idx = index // 8
            bit_idx = index % 8
            if not (self.bit_array[byte_idx] & (1 << bit_idx)):
                return False
                
        # Step 3: Secondary Catch-All (resolving false positive via verified layer)
        if json_content_layer is not None:
            return item in json_content_layer
            
        return True

    def export_to_binary(self, filename="bloom_filter.bin"):
        """Lightweight serialization: compress bytearray directly using zlib."""
        compressed_data = zlib.compress(self.bit_array)
        with open(filename, 'wb') as f:
            f.write(compressed_data)

    def load_from_binary(self, filename="bloom_filter.bin"):
        """Loads and decompresses the bit array from disk."""
        with open(filename, 'rb') as f:
            compressed_data = f.read()
        self.bit_array = bytearray(zlib.decompress(compressed_data))
