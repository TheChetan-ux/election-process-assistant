from flask import Flask, request, jsonify
from flask_compress import Compress
from flask_talisman import Talisman
from flask_cors import CORS
from app.config.settings import Config
from app.models.rate_limiter import TokenBucketRateLimiter, SlidingWindowIPRateLimiter
import logging

compress = Compress()
cors = CORS()

# Custom rate limiters
global_token_bucket = TokenBucketRateLimiter(capacity=1000, refill_rate=100) # 100 req/sec globally
ip_rate_limiter = SlidingWindowIPRateLimiter(limit=10, window_size=60)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    compress.init_app(app) # Gzip compression on all responses
    cors.init_app(app)
    
    # Security Headers (Helmet equivalent)
    csp = {
        'default-src': [
            '\'self\'',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ],
        'script-src': [
            '\'self\'',
            '\'unsafe-inline\'', 
        ],
        'style-src': [
            '\'self\'',
            '\'unsafe-inline\'',
            'https://fonts.googleapis.com'
        ],
        'img-src': ['\'self\'', 'data:', 'https:'],
        'connect-src': ['\'self\'', 'https://generativelanguage.googleapis.com', 'https://translation.googleapis.com']
    }
    Talisman(app, content_security_policy=csp, force_https=False) # Set force_https=True in prod
    
    # Logging system
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Register blueprints
    from app.routes.api import api_bp
    from app.routes.main import main_bp
    app.register_blueprint(api_bp)
    app.register_blueprint(main_bp)

    @app.before_request
    def before_request():
        # Global Token Bucket Limiter
        if not global_token_bucket.allow_request():
             return jsonify({"error": "Global rate limit exceeded. Please try again later."}), 429
             
        # IP based sliding window
        client_ip = request.remote_addr
        if not ip_rate_limiter.allow_request(client_ip):
             return jsonify({"error": "Too many requests from your IP. Max 10 per minute."}), 429

        # Honeypot field to detect and block bots automatically
        # Assuming the frontend sends a 'bot_trap' field in POST requests that should be empty
        if request.method == 'POST' and request.is_json:
            data = request.get_json(silent=True)
            if data and data.get('bot_trap'):
                app.logger.warning(f"Bot detected from IP: {client_ip}")
                return jsonify({"error": "Bad request"}), 400

    # Proper error handling
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return jsonify({"error": "Internal server error"}), 500

    return app
