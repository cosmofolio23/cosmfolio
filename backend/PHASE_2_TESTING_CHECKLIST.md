# Phase 2 Testing & Documentation Checklist
## Asset Management System

**Status**: In Progress  
**Coverage**: 100+ test cases across 10 areas  
**Execution Time**: ~15-20 minutes

---

## 1. Asset Upload & Storage (18 tests)

### Single File Upload
- [ ] Upload valid image (JPEG, PNG, WebP)
- [ ] Upload valid document (PDF, DOCX)
- [ ] Upload with metadata (tags, description)
- [ ] Upload with preview generation
- [ ] Verify file stored in S3/Supabase Storage
- [ ] Verify asset record created in database
- [ ] Verify file size validation (100KB-100MB)
- [ ] Verify MIME type whitelist enforcement

### Error Cases
- [ ] Reject file under 100KB (too small)
- [ ] Reject file over 100MB (too large)
- [ ] Reject invalid MIME type (e.g., .exe)
- [ ] Reject corrupted file (invalid magic number)
- [ ] Handle upload interruption (connection loss)
- [ ] Verify proper error response codes (400, 413)

### Batch Upload
- [ ] Upload 5+ files simultaneously
- [ ] Verify all files stored correctly
- [ ] Verify asset records created for all
- [ ] Verify partial failure handling (some succeed, some fail)
- [ ] Verify error reporting for failed uploads

---

## 2. Asset Organization & Search (15 tests)

### Tagging System
- [ ] Add single tag to asset
- [ ] Add multiple tags to asset
- [ ] Remove tag from asset
- [ ] Query assets by single tag
- [ ] Query assets by multiple tags (AND logic)
- [ ] Query assets by multiple tags (OR logic)
- [ ] Verify tag case sensitivity
- [ ] Verify tag deduplication

### Search Functionality
- [ ] Full-text search by filename
- [ ] Full-text search by description
- [ ] Search with pagination (limit/offset)
- [ ] Verify search result relevance
- [ ] Verify search performance with 1000+ assets
- [ ] Search with no results (proper empty response)
- [ ] Search with special characters in query

### Filtering
- [ ] Filter by asset type (image, video, document)
- [ ] Filter by date range
- [ ] Filter by file size range
- [ ] Filter by aspect ratio (for images)
- [ ] Combine filters (type AND tags AND date)
- [ ] Verify filtering accuracy

---

## 3. Asset Preview & Thumbnails (12 tests)

### Thumbnail Generation
- [ ] Generate 250px thumbnail
- [ ] Generate 500px thumbnail
- [ ] Generate 1200px preview
- [ ] Verify thumbnail dimensions
- [ ] Verify thumbnail file size (optimized)
- [ ] Verify WebP conversion on thumbnails

### Blur-Up Loading
- [ ] Generate blur placeholder
- [ ] Generate blur data URL (base64)
- [ ] Verify blur placeholder dimensions (40x40)
- [ ] Verify blur placeholder quality (low)
- [ ] Verify blur data URL format

### Preview Metadata
- [ ] Get responsive image config
- [ ] Generate SRCSET string
- [ ] Get dominant color from image
- [ ] Get preview statistics (total generated)
- [ ] Verify cache headers on preview endpoints

---

## 4. Image Optimization (14 tests)

### Format Conversion
- [ ] Convert JPEG to WebP
- [ ] Convert PNG to WebP
- [ ] Convert to JPEG
- [ ] Convert to AVIF (if supported)
- [ ] Verify format-specific quality settings
- [ ] Verify compression efficiency (~30% better than JPEG)

### Adaptive Compression
- [ ] Compress to target size (e.g., 200KB)
- [ ] Verify quality adjusted automatically
- [ ] Verify multiple quality attempts until target met
- [ ] Verify compression statistics returned

### Batch Optimization
- [ ] Optimize 10 images in batch
- [ ] Verify all optimized successfully
- [ ] Verify total compression stats calculated
- [ ] Verify error handling for individual failures

### Optimization Recommendations
- [ ] Analyze image and recommend format
- [ ] Score WebP vs JPEG efficiency
- [ ] Return quality recommendations
- [ ] Return size predictions

---

## 5. Asset Versioning (12 tests)

### Version Creation
- [ ] Create new version on upload
- [ ] Increment version number correctly
- [ ] Store version metadata
- [ ] Store version notes
- [ ] Verify version creation timestamp

### Version History
- [ ] Retrieve full version history
- [ ] Verify version ordering (newest first)
- [ ] Verify pagination in history
- [ ] Retrieve specific version details
- [ ] Verify version storage paths

### Version Restoration
- [ ] Restore to previous version
- [ ] Verify restoration creates new version
- [ ] Verify current version moved to history
- [ ] Verify asset pointer updated
- [ ] Verify restoration notes stored

### Version Cleanup
- [ ] Clean old versions (keep 10)
- [ ] Verify cleanup removes excess versions
- [ ] Verify current version never deleted

---

## 6. Caching & CDN (10 tests)

### Cache Headers
- [ ] Get cache headers for image (1 year, immutable)
- [ ] Get cache headers for document (7 days)
- [ ] Get cache headers for preview (1 day)
- [ ] Verify ETag generation
- [ ] Verify Vary header for compression

### Cache Invalidation
- [ ] Invalidate single asset cache
- [ ] Invalidate multiple assets
- [ ] Generate invalidation tags
- [ ] Generate CDN-specific payload

### Cache Warming
- [ ] Get cache warming URLs
- [ ] Verify URLs for all preview sizes
- [ ] Warm cache for multiple assets

### Cache Analysis
- [ ] Analyze cache configuration
- [ ] Get cache effectiveness score
- [ ] Get compression recommendations
- [ ] Estimate bandwidth savings

---

## 7. Authorization & Security (10 tests)

### Portfolio Ownership
- [ ] User A cannot upload to User B's portfolio
- [ ] User A cannot view User B's assets
- [ ] User A cannot delete User B's assets
- [ ] User A cannot modify User B's tags
- [ ] User A cannot restore User B's versions

### Asset Permissions
- [ ] Cannot access asset with invalid portfolio_id
- [ ] Cannot access asset with invalid asset_id
- [ ] Verify RLS policies enforced
- [ ] Verify token validation on all endpoints

### Public Portfolio Access
- [ ] Public portfolio assets accessible without auth
- [ ] Private portfolio assets return 403 without auth

---

## 8. Error Handling (8 tests)

### Response Codes
- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing token
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for missing resources
- [ ] 413 Payload Too Large for oversized file
- [ ] 500 Internal Server Error with proper logging

### Error Messages
- [ ] Error messages are clear and actionable
- [ ] Error messages don't leak sensitive info
- [ ] Validation errors list all violations
- [ ] Database errors handled gracefully

---

## 9. Performance & Scalability (8 tests)

### Load Testing
- [ ] Asset upload with 5MB file < 10 seconds
- [ ] Search with 1000+ assets < 1 second
- [ ] Thumbnail generation < 5 seconds
- [ ] Optimization batch (10 images) < 30 seconds
- [ ] Version history retrieval < 1 second

### Database Performance
- [ ] Index on portfolio_id, user_id, asset_type
- [ ] Index on asset tags for fast filtering
- [ ] Index on asset versions
- [ ] Verify query plans are efficient

### Pagination
- [ ] Test with limit=10, offset=0
- [ ] Test with limit=100, offset=50
- [ ] Verify total_count accuracy
- [ ] Verify has_more flag

---

## 10. Integration Tests (7 tests)

### Full Upload Workflow
- [ ] Upload file → Store → Create asset → Generate preview → Generate thumbnail
- [ ] Verify all steps succeed
- [ ] Verify data consistency across tables

### Search + Filter Workflow
- [ ] Upload multiple tagged assets
- [ ] Search by tag
- [ ] Filter by type
- [ ] Verify results

### Versioning Workflow
- [ ] Upload file (v1)
- [ ] Upload new version (v2)
- [ ] View history
- [ ] Restore v1
- [ ] Verify v3 created from v1

### Caching Workflow
- [ ] Upload image
- [ ] Get cache headers
- [ ] Request preview (expect cache hit)
- [ ] Invalidate cache
- [ ] Verify cache cleared

---

## Manual Testing Scenarios

### Scenario 1: Photographer Portfolio
1. Create portfolio
2. Upload 50 architecture photos (varying sizes)
3. Tag by project type (residential, commercial)
4. Search "residential" → verify results
5. Create variations using optimization
6. Verify thumbnails load fast
7. Restore previous version of one image

**Success Criteria**: All operations complete in < 2 minutes, no errors

### Scenario 2: Document Management
1. Upload PDF, DOCX, PPTX documents
2. Tag by category (plans, specifications, reports)
3. Search documents
4. Filter by date modified
5. Create version history for PDF
6. Restore previous PDF version

**Success Criteria**: All document types handled, versioning works

### Scenario 3: Concurrent Access
1. Two users upload to different portfolios simultaneously
2. Both search their respective assets
3. Both attempt to access each other's assets (should fail)
4. Both create versions simultaneously

**Success Criteria**: No conflicts, proper isolation maintained

---

## API Documentation Endpoints

### Assets
- `POST /portfolios/{id}/assets` - Upload single
- `POST /portfolios/{id}/assets/bulk` - Upload batch
- `GET /portfolios/{id}/assets` - List with search
- `GET /portfolios/{id}/assets/{id}` - Get details
- `PUT /portfolios/{id}/assets/{id}` - Update metadata
- `DELETE /portfolios/{id}/assets/{id}` - Delete

### Search
- `GET /portfolios/{id}/search` - Multi-filter search
- `GET /portfolios/{id}/search/by-filename` - Text search
- `GET /portfolios/{id}/search/by-tags` - Tag filtering
- `GET /portfolios/{id}/tags` - Get all tags
- `GET /portfolios/{id}/collections` - Group by type

### Previews
- `GET /portfolios/{id}/assets/{id}/preview` - Get thumbnail
- `GET /portfolios/{id}/assets/{id}/blur` - Get blur placeholder
- `GET /portfolios/{id}/assets/{id}/preview-metadata` - Get metadata
- `GET /portfolios/{id}/assets/{id}/responsive-config` - React config
- `GET /portfolios/{id}/assets/{id}/color` - Dominant color

### Optimization
- `POST /portfolios/{id}/optimize/convert-webp` - Convert to WebP
- `POST /portfolios/{id}/optimize/adaptive` - Adaptive compression
- `POST /portfolios/{id}/optimize/resize` - Resize and optimize
- `POST /portfolios/{id}/optimize/batch` - Batch optimization
- `POST /portfolios/{id}/optimize/recommend` - Get recommendations

### Versioning
- `GET /portfolios/{id}/assets/{id}/versions` - Get history
- `GET /portfolios/{id}/assets/{id}/versions/{num}` - Get specific version
- `POST /portfolios/{id}/assets/{id}/versions/{num}/restore` - Restore version
- `GET /portfolios/{id}/assets/{id}/versions/{a}/compare/{b}` - Compare versions

### Caching
- `GET /portfolios/{id}/cache/analysis` - Analyze cache config
- `GET /portfolios/{id}/cache/statistics` - Get cache stats
- `POST /portfolios/{id}/cache/invalidate` - Invalidate cache
- `POST /portfolios/{id}/cache/warm` - Warm cache
- `GET /portfolios/{id}/cdn/config` - CDN configuration

---

## Success Criteria

### Backend
- ✅ All 100+ tests pass
- ✅ No security vulnerabilities (RLS enforced)
- ✅ Proper error handling (5 error codes)
- ✅ Response time < 1s for 95% of requests
- ✅ Database queries optimized (using indexes)

### Frontend
- ✅ Asset Manager component renders without errors
- ✅ Upload progress displays correctly
- ✅ Search and filters work
- ✅ Grid and list views switch smoothly
- ✅ Version history modal opens and displays versions

### Integration
- ✅ Upload → Preview generation → Thumbnail creation pipeline works
- ✅ Search and filtering returns correct results
- ✅ Authorization enforced across all endpoints
- ✅ Cache headers applied correctly
- ✅ Error responses formatted consistently

---

## Regression Testing

Before declaring Phase 2 complete, verify:
- [ ] Phase 1 auth still works
- [ ] Phase 1 portfolio CRUD still works
- [ ] Page configuration still works
- [ ] No new 500 errors in logs
- [ ] No breaking changes to existing endpoints

---

## Performance Benchmarks

| Operation | Target | Status |
|-----------|--------|--------|
| Upload 10MB file | < 30s | ⏳ TBD |
| Generate thumbnails | < 5s | ⏳ TBD |
| Search 1000 assets | < 1s | ⏳ TBD |
| Batch optimize 10 images | < 30s | ⏳ TBD |
| Get version history | < 1s | ⏳ TBD |

---

## Known Issues & Limitations

- AVIF conversion may fail on systems without AVIF support (falls back to WebP)
- Blur placeholder generation requires PIL/Pillow
- Version cleanup is manual (not automatic on upload)
- Cache statistics are estimated (not from actual CDN)

---

## Next Steps (Phase 3)

After Phase 2 completion:
1. Design system and layout customization
2. Style packs and themes
3. Custom CSS support
4. Layout preview system

