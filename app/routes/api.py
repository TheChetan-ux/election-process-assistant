from flask import Blueprint, request, jsonify
from app.helpers.gemini import ask_gemini, generate_quiz
from app.helpers.translate import translate_text, translate_batch
from app.helpers.deduplication import deduplicator
from app.helpers.security import sanitize_html
from app.models.radix_tree import RadixTree
from app.models.bloom_filter import BloomFilter
from app.models.merkle_tree import MerkleTree
from app.services.content_engine import ProceduralContentEngine
import asyncio
import json
import os

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize autocomplete Radix Tree
search_trie = RadixTree()
common_questions = [
    "How to register to vote?",
    "Where is my polling station?",
    "What ID do I need to vote?",
    "How does the electoral college work?",
    "Can I vote by mail?",
    "What is early voting?",
    "Who is eligible to vote?",
    "How are votes counted?"
]
for q in common_questions:
    search_trie.insert(q, data="FAQ")

# Initialize Bloom Filter for 1.3B users (using 1MB limit simulation)
voter_filter = BloomFilter(size_mb=1, expected_elements=100_000)
# Add some mock data (Must match [A-Z]{3}\d{7} pattern)
voter_filter.add("WBA1234567")
voter_filter.add("KER9876543")
voter_filter.add("TNA5555555")

# --- Module B Initializations ---
# Load 2026 Election Ground Truth (Leaves) and generate Merkle Root
ELECTION_DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/election_2026.json')
with open(ELECTION_DATA_PATH, 'r') as f:
    election_data = json.load(f)

# Insert Candidates into Radix Tree for Deep-Link Candidate Indexing
for candidate in election_data.get('candidates', []):
    search_trie.insert(candidate['name'].lower(), data=f"Candidate: {candidate['name']} ({candidate['party']}) - {candidate['state']}")
# Initialize Procedural Content Engine
content_engine = ProceduralContentEngine()

election_merkle_tree = MerkleTree(election_data.get('election_events', []) + election_data.get('candidates', []))

@api_bp.route('/chat', methods=['POST'])
async def chat():
    """
    Handles conversational AI queries. Uses Gemini 2.5 Flash via an async deduplicator.
    
    Args:
        JSON body containing 'question' (str), 'lang' (str), and optional 'silence_period' (bool).
        
    Returns:
        JSON: {'answer': str} or an error response.
    """
    data = request.get_json(silent=True)
    if not data or 'question' not in data:
        return jsonify({"error": "Missing question parameter"}), 400
        
    question = data['question'].strip()
    target_lang = data.get('lang', 'en')
    is_silence_period = data.get('silence_period', False)
    
    # Input validation
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400
    if len(question) > 500:
        return jsonify({"error": "Question too long. Max 500 characters."}), 400
        
    # Deduplicate and Execute via Gemini Helper
    try:
        answer = await deduplicator.execute(
            f"{question}_{target_lang}_{is_silence_period}", 
            ask_gemini, 
            question, 
            target_lang=target_lang, 
            is_silence_period=is_silence_period
        )
    except Exception as e:
        return jsonify({"error": f"AI Processing Error: {str(e)}"}), 500
        
    # Security: HTML Sanitization (XSS Prevention)
    safe_answer = sanitize_html(answer)
    
    return jsonify({"answer": safe_answer})

@api_bp.route('/autocomplete', methods=['GET'])
def autocomplete():
    """Search suggestion feature"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({"suggestions": []})
        
    # Max length validation
    if len(query) > 100:
        return jsonify({"suggestions": []})
        
    suggestions = search_trie.autocomplete(query)
    # Extract just the words
    suggestions = [s['word'].capitalize() for s in suggestions]
    return jsonify({"suggestions": suggestions})

@api_bp.route('/election-schedule', methods=['GET'])
def election_schedule():
    """Returns the schedule + the Merkle Root for tamper-proof verification"""
    return jsonify({
        "events": election_data.get('election_events', []),
        "merkle_root": election_merkle_tree.get_root()
    })

@api_bp.route('/generate-quiz', methods=['GET'])
async def generate_quiz_endpoint():
    """Returns a procedurally generated set of 5 questions"""
    num_questions = request.args.get('num', 5, type=int)
    lang = request.args.get('lang', 'en')
    quiz = await generate_quiz(target_lang=lang)
    return jsonify({"quiz": quiz})

@api_bp.route('/verify-voter', methods=['POST'])
def verify_voter():
    """Verify Voter ID using Bloom Filter"""
    data = request.get_json()
    if not data or 'voter_id' not in data:
        return jsonify({"error": "Missing voter_id parameter"}), 400
    
    voter_id = data['voter_id'].upper()
    is_valid = voter_filter.check(voter_id)
    
    return jsonify({"valid": is_valid, "message": "Voter ID might be valid" if is_valid else "Voter ID is definitely not in our system."})

@api_bp.route('/translate-batch', methods=['POST'])
async def translate_batch_endpoint():
    """Batch translates an array of strings to the target language"""
    data = request.get_json()
    if not data or 'texts' not in data:
        return jsonify({"error": "Missing texts"}), 400
    texts = data['texts']
    lang = data.get('lang', 'en')
    
    if lang == 'en':
        return jsonify({"translations": texts})
        
    try:
        translated = await translate_batch(texts, lang)
        return jsonify({"translations": translated})
    except Exception:
        return jsonify({"translations": texts})

@api_bp.route('/health', methods=['GET'])
def health_check():
    """
    Standard health check endpoint for monitoring and load balancers.
    """
    return jsonify({
        "status": "healthy",
        "version": "1.2.0",
        "service": "VoteWise AI Core"
    }), 200
