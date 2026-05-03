import logging
import uuid
from flask import request, has_request_context

class RequestFormatter(logging.Formatter):
    """
    Custom formatter to include a unique Request ID in every log line.
    Allows for distributed tracing of user requests.
    """
    def format(self, record):
        if has_request_context():
            record.request_id = getattr(request, 'request_id', 'N/A')
        else:
            record.request_id = 'SYSTEM'
        return super().format(record)

def setup_logger(name: str) -> logging.Logger:
    """
    Configures a professional logger with structured output.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    formatter = RequestFormatter(
        '[%(asctime)s] [%(request_id)s] [%(levelname)s] in %(module)s: %(message)s'
    )
    handler.setFormatter(formatter)
    
    if not logger.handlers:
        logger.addHandler(handler)
        
    return logger
