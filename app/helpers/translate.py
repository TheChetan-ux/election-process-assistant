import os
import aiohttp
import json
from app.models.lru_cache import LRUCache

# Environment Variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

translation_cache = LRUCache(capacity=5000)

async def translate_text(text: str, target_lang: str) -> str:
    """Multilingual support using Gemini Flash"""
    if not GEMINI_API_KEY or target_lang == 'en' or not text:
        return text
        
    cache_key = f"{target_lang}_{hash(text)}"
    cached = translation_cache.get(cache_key)
    if cached:
        return cached
        
    url = f"https://generativelanguage.googleapis.com/v1/models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": f"Translate the following text to the language code '{target_lang}'. Output ONLY the translated text, nothing else.\n\nText: {text}"}]}],
        "generationConfig": {"temperature": 0.1}
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    translated = data['candidates'][0]['content']['parts'][0]['text'].strip()
                    translation_cache.put(cache_key, translated)
                    return translated
                else:
                    return text
    except Exception:
        return text

async def translate_batch(texts: list, target_lang: str) -> list:
    """Batch translation of multiple strings using Gemini to save API calls."""
    if not GEMINI_API_KEY or target_lang == 'en' or not texts:
        return texts
        
    cache_key = f"{target_lang}_batch_{hash(str(texts))}"
    cached = translation_cache.get(cache_key)
    if cached:
        return cached

    prompt = f"Translate the following JSON array of strings to the language code '{target_lang}'. Output ONLY a valid JSON array of strings containing the translations, maintaining the exact same order and length.\n\nJSON:\n{json.dumps(texts)}"
    
    url = f"https://generativelanguage.googleapis.com/v1/models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1}
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    result_text = data['candidates'][0]['content']['parts'][0]['text'].replace('```json', '').replace('```', '').strip()
                    translated = json.loads(result_text)
                    translation_cache.put(cache_key, translated)
                    return translated
                else:
                    return texts
    except Exception:
        return texts

