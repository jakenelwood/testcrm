FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with timeout settings
RUN pip install --no-cache-dir --upgrade pip --timeout 60 --retries 3 && \
    pip install --no-cache-dir -r requirements.txt --timeout 60 --retries 3

# Copy application files
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
