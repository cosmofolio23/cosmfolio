# CosmoFolio Backend - FastAPI Server
FROM python:3.11-slim

# Set working directory
WORKDIR /backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from root
COPY requirements.txt /

# Install Python dependencies
RUN pip install --no-cache-dir -r /requirements.txt

# Copy entire backend directory
COPY backend/ /backend/

# Set Python path and environment
ENV PYTHONPATH=/backend:$PYTHONPATH
ENV PYTHONUNBUFFERED=1

# Verify main.py exists
RUN ls -la /backend/main.py

# Expose port
EXPOSE 8000

# Run uvicorn with explicit path
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
