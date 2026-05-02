from dotenv import load_dotenv
import os
load_dotenv() # Load variables from .env BEFORE importing the app

from app import create_app
app = create_app()

if __name__ == '__main__':
    # Use gunicorn in production for async support
    app.run(host='0.0.0.0', port=5000, debug=True)
