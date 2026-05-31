# Database Optimization Guide
## Phase 7: Task 7.1 - Performance Tuning & Index Strategy

---

## Overview

This guide covers database optimization strategies for CosmoFolio using Supabase (PostgreSQL). Includes indexes, query optimization, caching strategies, and monitoring.

---

## 1. Essential Indexes

### User & Auth Indexes

```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Auth activity
CREATE INDEX idx_auth_attempts_user_id ON auth_attempts(user_id);
CREATE INDEX idx_auth_attempts_timestamp ON auth_attempts(created_at DESC);
```

### Portfolio Indexes

```sql
-- Main portfolio queries
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_user_created ON portfolios(user_id, created_at DESC);
CREATE INDEX idx_portfolios_status ON portfolios(status);
CREATE INDEX idx_portfolios_updated_at ON portfolios(updated_at DESC);
CREATE INDEX idx_portfolios_slug ON portfolios(slug);

-- Publication queries
CREATE INDEX idx_publications_portfolio_id ON portfolios_publications(portfolio_id);
CREATE INDEX idx_publications_user_id ON portfolios_publications(user_id);
CREATE INDEX idx_publications_token ON portfolios_publications(public_token);
CREATE INDEX idx_publications_slug_token ON portfolios_publications(public_slug, public_token);
CREATE INDEX idx_publications_status ON portfolios_publications(status);
```

### Analytics Indexes

```sql
-- Analytics queries
CREATE INDEX idx_analytics_portfolio_id ON portfolio_analytics(portfolio_id);
CREATE INDEX idx_analytics_viewed_at ON portfolio_analytics(viewed_at DESC);
CREATE INDEX idx_analytics_portfolio_date ON portfolio_analytics(portfolio_id, viewed_at DESC);

-- Composite for common queries
CREATE INDEX idx_analytics_composite ON portfolio_analytics(
  portfolio_id,
  viewed_at DESC,
  visitor_ip
);
```

### Content & Assets Indexes

```sql
-- Portfolio content
CREATE INDEX idx_content_portfolio_id ON portfolio_content(portfolio_id);
CREATE INDEX idx_content_type ON portfolio_content(content_type);
CREATE INDEX idx_content_portfolio_type ON portfolio_content(portfolio_id, content_type);

-- Assets
CREATE INDEX idx_assets_portfolio_id ON portfolio_assets(portfolio_id);
CREATE INDEX idx_assets_type ON portfolio_assets(asset_type);
CREATE INDEX idx_assets_status ON portfolio_assets(storage_status);
```

### Share & Collaboration Indexes

```sql
-- Share tokens
CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_share_tokens_portfolio ON share_tokens(portfolio_id);
CREATE INDEX idx_share_tokens_expiry ON share_tokens(expires_at);

-- Collaborators
CREATE INDEX idx_collaborators_portfolio ON collaborators(portfolio_id);
CREATE INDEX idx_collaborators_user ON collaborators(user_id);
```

---

## 2. Partitioning Strategy

For large tables, use partitioning to improve query performance:

```sql
-- Partition analytics by date (monthly)
CREATE TABLE portfolio_analytics (
  id BIGSERIAL,
  portfolio_id UUID,
  viewed_at TIMESTAMPTZ,
  visitor_ip INET,
  -- ... other columns
  PRIMARY KEY (id, viewed_at)
) PARTITION BY RANGE (viewed_at);

-- Create monthly partitions
CREATE TABLE portfolio_analytics_2026_05 PARTITION OF portfolio_analytics
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE portfolio_analytics_2026_06 PARTITION OF portfolio_analytics
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- ... continue for future months
```

---

## 3. Query Optimization

### Common Queries with Indexes

#### Get User Portfolios
```sql
-- GOOD: Uses index
SELECT * FROM portfolios 
WHERE user_id = $1 
ORDER BY created_at DESC
LIMIT 50;
```

#### Get Published Portfolio
```sql
-- GOOD: Uses composite index
SELECT p.*, pp.* FROM portfolios p
JOIN portfolios_publications pp ON p.id = pp.portfolio_id
WHERE pp.public_slug = $1 AND pp.public_token = $2
LIMIT 1;
```

#### Get Analytics with Timeframe
```sql
-- GOOD: Uses composite index
SELECT * FROM portfolio_analytics
WHERE portfolio_id = $1 
  AND viewed_at >= NOW() - INTERVAL '30 days'
ORDER BY viewed_at DESC;
```

### Avoid These Patterns

```sql
-- BAD: Full table scan
SELECT * FROM portfolios WHERE LOWER(title) LIKE '%keyword%';

-- BAD: No index used
SELECT * FROM portfolio_analytics WHERE visitor_ip = '192.168.1.1';

-- BAD: OR conditions require careful planning
SELECT * FROM portfolios WHERE user_id = $1 OR status = 'public';
-- Better: Use UNION or separate queries
```

---

## 4. Caching Strategy

### Query Result Caching

```python
from services.cache import get_cache_service

# Cache user portfolios (30 minutes)
def get_user_portfolios(user_id: str):
    cache_key = f"user_portfolios:{user_id}"
    cached = cache_service.get(cache_key)
    
    if cached:
        return cached
    
    # Query database
    portfolios = db.query(...).all()
    
    # Cache result
    cache_service.set(cache_key, portfolios, ttl=1800)
    
    return portfolios
```

### Cache Invalidation

```python
# Invalidate when portfolio updated
def update_portfolio(portfolio_id, data):
    db.update(portfolio_id, data)
    
    # Invalidate affected caches
    cache_service.invalidate_portfolio_cache(portfolio_id)
    cache_service.invalidate_user_cache(get_portfolio_owner(portfolio_id))
```

---

## 5. Connection Pooling

Configure Supabase connection pooling:

```python
# backend/config/database.py

DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")

# Supabase pgBouncer settings (via .env)
# Connection pool size: 100
# Max connections: 500
# Idle timeout: 600s

sqlalchemy_engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Let Supabase handle pooling
    echo=False,
)
```

### Environment Variables

```env
# Database pooling
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_SIZE=5
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600

# Query timeouts
DATABASE_QUERY_TIMEOUT=30
DATABASE_LOCK_TIMEOUT=5
```

---

## 6. JSON Columns Optimization

For nested portfolio data:

```sql
-- Use JSONB for better performance
ALTER TABLE portfolios ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;

-- Create GIN index for JSONB queries
CREATE INDEX idx_portfolio_metadata ON portfolios USING GIN(metadata);

-- Query optimized JSONB
SELECT * FROM portfolios 
WHERE metadata @> '{"style_pack": "dark_studio"}';
```

---

## 7. Full-Text Search Optimization

For portfolio search:

```sql
-- Create tsvector column
ALTER TABLE portfolios ADD COLUMN search_vector tsvector;

-- Update function
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.author, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER portfolio_search_vector_update
BEFORE INSERT OR UPDATE ON portfolios
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- Create GIN index
CREATE INDEX idx_portfolio_search ON portfolios USING GIN(search_vector);

-- Query
SELECT * FROM portfolios 
WHERE search_vector @@ plainto_tsquery('architecture');
```

---

## 8. Statistics & Monitoring

### Update Table Statistics

```sql
-- Analyze all tables
ANALYZE;

-- Analyze specific table
ANALYZE portfolios;

-- Check last analyze time
SELECT schemaname, tablename, last_analyze 
FROM pg_stat_user_tables 
ORDER BY last_analyze DESC;
```

### Monitor Query Performance

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries >1s

-- View query stats
SELECT 
  query,
  mean_exec_time,
  calls,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 9. Vacuum & Maintenance

```sql
-- Manual vacuum (recommended weekly)
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE portfolios;

-- Check index health
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 10. Performance Benchmarks

### Target Metrics

| Operation | Target | Notes |
|-----------|--------|-------|
| Get user portfolios | <100ms | Cached |
| Get public portfolio | <50ms | Read-heavy |
| List analytics | <200ms | Date indexed |
| Search portfolios | <500ms | Full-text search |
| Create portfolio | <500ms | Write operation |
| Generate PDF | 2-5s | External service |

### Monitoring Query

```python
import time

def monitored_query(query_name: str):
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start
            
            # Log if slow
            if duration > 1.0:
                logger.warning(f"{query_name} took {duration:.2f}s")
            
            return result
        return wrapper
    return decorator

@monitored_query("get_user_portfolios")
def get_user_portfolios(user_id):
    # ... query code
```

---

## 11. Scaling Considerations

### When to Add More Resources

- **CPU**: Slow analytical queries, complex joins
- **Memory**: Cache misses, large result sets
- **Disk**: Growing data, large backups
- **Connections**: Too many open connections

### Read Replicas

For high read volume, configure read replicas:

```python
# Master (write operations)
WRITE_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")

# Replica (read operations)
READ_DATABASE_URL = os.getenv("SUPABASE_DATABASE_REPLICA_URL")

def get_read_connection():
    """Get read replica connection"""
    return sqlalchemy.create_engine(READ_DATABASE_URL)

def get_write_connection():
    """Get master connection"""
    return sqlalchemy.create_engine(WRITE_DATABASE_URL)
```

---

## 12. Backup & Recovery

### Regular Backups

```bash
# Daily backup to S3
#!/bin/bash
pg_dump $DATABASE_URL | gzip | \
  aws s3 cp - s3://backups/cosmofolio-$(date +%Y%m%d).sql.gz

# Weekly full backup
0 2 * * 0 /scripts/backup-full.sh

# Daily incremental backup
0 2 * * 1-6 /scripts/backup-incremental.sh
```

### Point-in-Time Recovery

- Supabase provides 24h PITR
- Request manual backups if needed
- Test recovery procedures monthly

---

## 13. Optimization Checklist

- ✅ Create all recommended indexes
- ✅ Set up query monitoring
- ✅ Configure caching strategy
- ✅ Enable connection pooling
- ✅ Set up automated vacuuming
- ✅ Test with production data volume
- ✅ Monitor slow query logs
- ✅ Plan for scaling
- ✅ Document maintenance procedures
- ✅ Schedule regular backups

---

## 14. Supabase-Specific Tips

### Real-time Subscriptions
```javascript
// Minimize subscriptions to reduce connections
const unsubscribe = supabase
  .from('portfolios')
  .on('*', payload => handleChange(payload))
  .subscribe();

// Unsubscribe when done
supabase.removeSubscription(unsubscribe);
```

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policies (automatically optimized by Supabase)
CREATE POLICY "Users can view own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);
```

---

**Last Updated:** 2026-05-30  
**Optimizer:** CosmoFolio Database Team
