import hashlib
import json

class MerkleTree:
    """
    Merkle Tree implementation for data integrity verification using strictly
    the Python standard library (hashlib).
    Ensures the tamper-proof nature of election data without adding external dependencies.
    """
    def __init__(self, data_list):
        self.leaves = []
        for item in data_list:
            # We hash the deterministic JSON string representation of the event
            if isinstance(item, dict):
                item_str = json.dumps(item, sort_keys=True)
            else:
                item_str = str(item)
            self.leaves.append(self._hash(item_str))
        
        self.root = self._build_tree(self.leaves)

    def _hash(self, data: str) -> str:
        """Returns the SHA-256 hash of the input string."""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    def _build_tree(self, nodes):
        """Recursively builds the tree, handling odd number of leaves gracefully."""
        if not nodes:
            return ""
        if len(nodes) == 1:
            return nodes[0]
        
        new_level = []
        # Process pairs of nodes
        for i in range(0, len(nodes), 2):
            left = nodes[i]
            # Standard RFC 6962 behavior: if odd number of leaves, duplicate the last node
            right = nodes[i + 1] if i + 1 < len(nodes) else left
            
            combined = left + right
            new_level.append(self._hash(combined))
        
        return self._build_tree(new_level)

    def get_root(self):
        """Returns the Merkle Root Hash."""
        return self.root

    @staticmethod
    def verify_integrity(data_list, root_hash):
        """
        Allows the frontend (or backend) to verify that the provided 
        election schedule exactly matches the expected root hash.
        """
        tree = MerkleTree(data_list)
        return tree.get_root() == root_hash
