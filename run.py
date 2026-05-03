import os

# --- Resilient .env Loader ---
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Manual fallback if python-dotenv is not installed
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

from app import create_app
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
