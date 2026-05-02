import os
import aiohttp

# Environment Variables
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

async def translate_text(text: str, target_lang: str) -> str:
    """Multilingual support for at least 3 languages using Google Translate API"""
    if not GOOGLE_API_KEY or target_lang == 'en':
        return text
        
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    payload = {
        "q": text,
        "target": target_lang,
        "format": "text"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['data']['translations'][0]['translatedText']
                else:
                    return text # Silent failure fallback to original text
    except Exception:
        return text
