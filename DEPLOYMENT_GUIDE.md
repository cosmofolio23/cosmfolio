# Deployment & DevOps Guide
## Phase 7: Task 7.4 - Production Deployment, Monitoring & Operations

---

## Executive Summary

Complete deployment strategy including:
- ✅ Docker containerization (backend + frontend)
- ✅ Docker Compose (local dev & staging)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Production deployment (AWS/Vercel)
- ✅ Database backup & recovery
- ✅ Monitoring & alerting
- ✅ SSL/TLS certificates
- ✅ Environment configuration

---

## 1. Docker Setup

### 1.1 Backend Dockerfile

```dockerfile
# Multi-stage build for optimization
FROM python:3.11-slim as builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq5 curl
COPY --from=builder /root/.local /root/.local
COPY . .
RUN useradd -m cosmofolio && chown -R cosmofolio /app
USER cosmofolio
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/health
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

### 1.2 Frontend Dockerfile

```dockerfile
# Node.js multi-stage build
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

### 1.3 Docker Compose Configuration

See `docker-compose.yml` (complete config provided)

**Services:**
- PostgreSQL database
- Redis cache
- FastAPI backend
- Next.js frontend
- Nginx reverse proxy (optional)

**Usage:**

```bash
# Local development
docker-compose up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend alembic upgrade head
```

---

## 2. Environment Configuration

### 2.1 Environment Variables

**Development (.env):**
```bash
# Database
DATABASE_URL=postgresql://cosmofolio:password@postgres:5432/cosmofolio
DB_PASSWORD=password

# Redis
REDIS_URL=redis://:password@redis:6379/0
REDIS_PASSWORD=password

# API Keys
REPLICATE_API_TOKEN=r8_...
OPENAI_API_KEY=sk-...

# Security
SECRET_KEY=<64-character-random-string>
CSRF_ENABLED=true

# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
```

**Production (.env.production):**
```bash
# Database
DATABASE_URL=postgresql://user:strong-password@prod-db.aws.amazon.com/cosmofolio
DB_PASSWORD=<strong-password>

# Redis
REDIS_URL=redis://:strong-password@prod-cache.aws.amazon.com:6379/0

# API Keys
REPLICATE_API_TOKEN=<production-token>
OPENAI_API_KEY=<production-key>

# Security
SECRET_KEY=<64-char-random>
CSRF_ENABLED=true
SECURE_COOKIES=true

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# HTTPS
SECURE_PROXY_HEADER=X-Forwarded-Proto
```

### 2.2 Secrets Management

**Option 1: AWS Secrets Manager**

```python
import boto3

def get_secret(secret_name: str) -> str:
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return response['SecretString']

# Usage in main.py
database_password = get_secret('cosmofolio/db-password')
api_token = get_secret('cosmofolio/replicate-token')
```

**Option 2: HashiCorp Vault**

```python
import hvac

client = hvac.Client(url='https://vault.company.com')
secret = client.secrets.kv.read_secret_version(path='cosmofolio')
database_password = secret['data']['data']['db_password']
```

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy CosmoFolio

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
      redis:
        image: redis:7
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: pytest --cov=backend
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Frontend tests
        run: |
          cd frontend
          npm install
          npm test
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t cosmofolio-backend:latest ./backend
          docker build -t cosmofolio-frontend:latest ./frontend
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push cosmofolio-backend:latest
          docker push cosmofolio-frontend:latest
      
      - name: Deploy to production
        run: |
          # Deploy to AWS ECS, Vercel, or your hosting platform
          # Example: AWS ECS update service
          aws ecs update-service \
            --cluster cosmofolio \
            --service cosmofolio-api \
            --force-new-deployment \
            --region us-east-1
```

---

## 4. Production Deployment

### 4.1 AWS ECS Deployment

**Task Definition:**

```json
{
  "family": "cosmofolio-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "account-id.dkr.ecr.us-east-1.amazonaws.com/cosmofolio-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account-id:secret:cosmofolio/db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cosmofolio",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

### 4.2 Vercel Frontend Deployment

**vercel.json:**

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_APP_URL": "@app_url"
  },
  "envs": {
    "production": {
      "NEXT_PUBLIC_API_URL": "https://api.cosmofolio.com",
      "NEXT_PUBLIC_APP_URL": "https://cosmofolio.com"
    }
  }
}
```

**Deployment:**

```bash
vercel deploy --prod
```

---

## 5. Database Management

### 5.1 Migrations (Alembic)

```bash
# Create migration
alembic revision --autogenerate -m "Add portfolio status field"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1

# View migration history
alembic history
```

### 5.2 Backup Strategy

**Automated Daily Backup:**

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="/backups/cosmofolio"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cosmofolio_$DATE.sql.gz"

# Backup database
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://backups-cosmofolio/

# Keep only 30 days of local backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Send notification
echo "Backup completed: $BACKUP_FILE" | mail -s "CosmoFolio Backup" ops@example.com
```

**Cron Job:**

```bash
# Run daily at 2 AM
0 2 * * * /scripts/backup.sh
```

### 5.3 Point-in-Time Recovery

```bash
# List available backups
aws s3 ls s3://backups-cosmofolio/

# Download backup
aws s3 cp s3://backups-cosmofolio/cosmofolio_20260530.sql.gz .

# Restore database
gunzip cosmofolio_20260530.sql.gz
psql $DATABASE_URL < cosmofolio_20260530.sql
```

---

## 6. Monitoring & Alerting

### 6.1 Application Monitoring (Sentry)

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    environment=os.getenv("ENVIRONMENT"),
    traces_sample_rate=0.1,
    release=os.getenv("APP_VERSION"),
)
```

### 6.2 Infrastructure Monitoring (DataDog)

```python
from datadog import initialize, api

options = {
    'api_key': os.getenv("DATADOG_API_KEY"),
    'app_key': os.getenv("DATADOG_APP_KEY"),
}

initialize(**options)

# Track custom metrics
api.Metric.send(
    metric='cosmofolio.portfolio.created',
    points=1,
    tags=['environment:production']
)
```

### 6.3 Alerting Rules

**High Error Rate:**
```
error_rate > 5% over 5 minutes → Alert
```

**Database Connection Issues:**
```
db_connections_available < 10 → Alert
```

**Cache Hit Rate:**
```
cache_hit_rate < 70% over 1 hour → Alert
```

**API Response Time:**
```
p95_response_time > 500ms over 5 minutes → Alert
```

---

## 7. SSL/TLS Certificates

### 7.1 Let's Encrypt with Certbot

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot certonly --standalone -d cosmofolio.com -d api.cosmofolio.com

# Auto-renewal (cron)
0 12 * * * certbot renew --quiet

# Certificate location
# /etc/letsencrypt/live/cosmofolio.com/
```

### 7.2 Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name cosmofolio.com;

    ssl_certificate /etc/letsencrypt/live/cosmofolio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cosmofolio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Redirect HTTP to HTTPS
    error_page 497 =301 https://$host$request_uri;
}

server {
    listen 80;
    server_name cosmofolio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 8. Scaling Considerations

### 8.1 Horizontal Scaling

**Backend:**
```bash
# Scale ECS service to 5 instances
aws ecs update-service \
  --cluster cosmofolio \
  --service cosmofolio-api \
  --desired-count 5
```

**Database:**
```bash
# Read replica for scaling reads
aws rds create-db-instance-read-replica \
  --db-instance-identifier cosmofolio-read-replica \
  --source-db-instance-identifier cosmofolio-primary
```

**Frontend:**
```bash
# CDN distribution via Cloudflare
# Automatic scaling on Vercel
```

### 8.2 Performance Tuning

- Enable database connection pooling
- Configure Redis for caching
- Set up CDN for static assets
- Implement database query optimization
- Use async operations for I/O

---

## 9. Security Checklist

- ✅ HTTPS enabled (SSL/TLS)
- ✅ Environment variables configured
- ✅ Secrets stored securely
- ✅ Rate limiting enabled
- ✅ CSRF protection enabled
- ✅ Security headers set
- ✅ Regular backups automated
- ✅ Monitoring & alerting active
- ✅ Database encryption enabled
- ✅ Access logs configured

---

## 10. Post-Deployment Verification

```bash
# Health check
curl https://api.cosmofolio.com/health

# Database connection
curl https://api.cosmofolio.com/api/portfolios -H "Authorization: Bearer token"

# Frontend availability
curl https://cosmofolio.com

# SSL certificate
openssl s_client -connect api.cosmofolio.com:443

# Performance check
lighthouse https://cosmofolio.com
```

---

## 11. Troubleshooting

**Database Connection Failed:**
```
Solution: Check DATABASE_URL, verify network connectivity
```

**Redis Connection Failed:**
```
Solution: Check REDIS_URL, verify Redis is running
```

**Certificate Expired:**
```
Solution: Run: certbot renew --force-renewal
```

**High Memory Usage:**
```
Solution: Check for memory leaks, restart services
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-30  
**Maintained By:** DevOps Team
