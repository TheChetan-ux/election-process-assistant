import hashlib
import bcrypt
import os
import base64
import jwt
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import html

# Environment variables should hold secret keys
JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-key-for-dev-only')
AES_SECRET = os.environ.get('AES_SECRET', 'aes-secret-key-for-dev-only')

def get_fernet():
    # Derive a 32-byte key from the secret for AES-256
    salt = b'election_salt_123'
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(AES_SECRET.encode()))
    return Fernet(key)

fernet = get_fernet()

def hash_input(data: str) -> str:
    """Hash and sanitize user inputs using SHA-256"""
    return hashlib.sha256(data.encode()).hexdigest()

def hash_password(password: str) -> str:
    """Bcrypt password hashing"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode('utf-8'))

def encrypt_data(data: str) -> str:
    """AES-256 encryption for stored sensitive data"""
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()

def generate_jwt(user_id: str) -> str:
    """JWT tokens for session management with short expiry times (1 hour)"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def sanitize_html(text: str) -> str:
    """XSS prevention by escaping all HTML output"""
    if not isinstance(text, str):
        return text
    return html.escape(text)
