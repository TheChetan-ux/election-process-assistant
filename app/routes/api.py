from flask import Blueprint, request, jsonify
from app.helpers.gemini import ask_gemini, generate_quiz
from app.helpers.translate import translate_text
from app.helpers.deduplication import deduplicator
from app.helpers.security import sanitize_html
from app.models.trie import Trie
import asyncio

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize autocomplete Trie
search_trie = Trie()
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
    search_trie.insert(q)

@api_bp.route('/chat', methods=['POST'])
async def chat():
    """Chat endpoint to handle user questions"""
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "Missing question parameter"}), 400
        
    question = data['question']
    target_lang = data.get('lang', 'en')
    
    # Input length validation
    if len(question) > 500:
        return jsonify({"error": "Question too long. Max 500 characters."}), 400
        
    # Deduplicate requests
    try:
        answer = await deduplicator.execute(question, ask_gemini, question)
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500
        
    # Translate if necessary
    if target_lang != 'en':
        answer = await translate_text(answer, target_lang)
        
    # XSS Prevention
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
    # Capitalize first letter for UI
    suggestions = [s.capitalize() for s in suggestions]
    return jsonify({"suggestions": suggestions})

@api_bp.route('/quiz', methods=['GET'])
async def quiz():
    """Dynamic quiz section"""
    target_lang = request.args.get('lang', 'en')
    quiz_data = await generate_quiz()
    
    # Translate quiz if needed
    if target_lang != 'en' and quiz_data:
        translated_quiz = []
        for q in quiz_data:
            t_q = await translate_text(q['question'], target_lang)
            t_options = [await translate_text(opt, target_lang) for opt in q['options']]
            t_answer = await translate_text(q['answer'], target_lang)
            translated_quiz.append({
                "question": t_q,
                "options": t_options,
                "answer": t_answer
            })
        quiz_data = translated_quiz
        
    return jsonify({"quiz": quiz_data})
