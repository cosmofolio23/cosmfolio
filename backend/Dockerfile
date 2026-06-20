FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# (pango/cairo/gdk-pixbuf + fonts are REQUIRED by WeasyPrint for PDF export —
#  without them `import weasyprint` fails at runtime and PDF export 500s)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    g++ \
    libffi-dev \
    libxml2-dev \
    libxslt-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libcairo2 \
    libcairo-gobject2 \
    shared-mime-info \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port
EXPOSE 8000

# Copy and set start script
COPY start.sh .
RUN chmod +x start.sh

# Run app - Railway uses $PORT env variable
CMD ["/bin/bash", "start.sh"]
