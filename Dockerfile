# Use the official lightweight Python image.
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Remove unnecessary files to keep image small
RUN rm -rf .git .env extracted_main_js.txt

# Set environment variables (Defaults)
ENV PORT=5000
ENV GEMINI_MODEL=gemini-2.5-flash

# Run the web service on container startup.
# Using gunicorn for production-grade performance.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 "run:app"
