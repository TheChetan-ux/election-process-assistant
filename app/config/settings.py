import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
    JWT_SECRET = os.environ.get('JWT_SECRET') or 'jwt-secret'
    AES_SECRET = os.environ.get('AES_SECRET') or 'aes-secret'
