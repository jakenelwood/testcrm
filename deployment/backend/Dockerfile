FROM python:3.11-slim

WORKDIR /app

# Install basic dependencies
RUN pip install fastapi uvicorn psycopg2-binary redis

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
