import zlib
import json

class RadixTree:
    """
    Space-Efficient Radix Tree (Compressed Trie) utilizing nested dictionaries 
    instead of class-heavy nodes to strictly minimize memory overhead.
    Edges are merged to reduce pointer depth.
    """
    def __init__(self):
        # The tree is a dictionary. End-of-word data is stored under the special key '*'.
        self.tree = {}

    def insert(self, word: str, data=None):
        """Inserts a word into the dictionary-based Radix tree with edge-merging."""
        word = word.lower()
        current = self.tree
        
        while len(word) > 0:
            match_key = None
            match_len = 0
            
            # Find the longest matching prefix among current node's keys
            for key in current.keys():
                if key == '*': continue
                l = 0
                while l < min(len(key), len(word)) and key[l] == word[l]:
                    l += 1
                if l > 0:
                    match_key = key
                    match_len = l
                    break
                    
            if match_key is None:
                # No common prefix with any existing branch, create a new full-edge
                current[word] = {'*': data}
                return
                
            if match_len == len(match_key):
                # The word fully consumes the matched key, traverse deeper
                current = current[match_key]
                word = word[match_len:]
                if len(word) == 0:
                    current['*'] = data
            else:
                # Partial match -> edge splitting is required
                common_prefix = match_key[:match_len]
                remaining_key = match_key[match_len:]
                remaining_word = word[match_len:]
                
                # Retrieve the old subtree and split the edge
                old_subtree = current.pop(match_key)
                
                new_node = {remaining_key: old_subtree}
                if len(remaining_word) == 0:
                    new_node['*'] = data
                else:
                    new_node[remaining_word] = {'*': data}
                    
                current[common_prefix] = new_node
                return

    def _dfs_autocomplete(self, node, current_word, results):
        if len(results) >= 10:
            return
        if '*' in node:
            results.append({"word": current_word, "data": node['*']})
            
        for key, child in node.items():
            if key != '*':
                self._dfs_autocomplete(child, current_word + key, results)

    def autocomplete(self, prefix: str):
        """
        Recursive autocomplete returning a list of matches.
        Follows the prefix L in O(L) time down the compressed edges.
        """
        prefix = prefix.lower()
        current = self.tree
        current_word = ""
        
        while len(prefix) > 0:
            match_key = None
            match_len = 0
            
            for key in current.keys():
                if key == '*': continue
                l = 0
                while l < min(len(key), len(prefix)) and key[l] == prefix[l]:
                    l += 1
                if l > 0:
                    match_key = key
                    match_len = l
                    break
                    
            if match_key is None:
                return [] # Prefix mismatch, no suggestions
                
            if match_len == len(prefix):
                # The search prefix is fully matched within this edge.
                # The remaining part of the key becomes part of the matched word.
                current = current[match_key]
                current_word += match_key
                break
            elif match_len == len(match_key):
                # Prefix spans across this key, traverse deeper
                current = current[match_key]
                current_word += match_key
                prefix = prefix[match_len:]
            else:
                # Prefix diverges from the key before being fully matched
                return []
                
        results = []
        self._dfs_autocomplete(current, current_word, results)
        return results

    def export_to_binary(self, filename="radix_tree.json.gz"):
        """Lightweight export to compressed JSON to stay under 10MB limit."""
        json_data = json.dumps(self.tree).encode('utf-8')
        compressed_data = zlib.compress(json_data)
        with open(filename, 'wb') as f:
            f.write(compressed_data)

    def load_from_binary(self, filename="radix_tree.json.gz"):
        """Loads from compressed binary JSON."""
        with open(filename, 'rb') as f:
            compressed_data = f.read()
        json_data = zlib.decompress(compressed_data).decode('utf-8')
        self.tree = json.loads(json_data)
