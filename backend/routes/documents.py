"""
Portfolio document persistence.

Stores the full composer document (pages, blocks, design tokens) as a JSON
file in Supabase Storage, keyed by project id. No schema migration required.
"""
from fastapi import APIRouter, HTTPException, status, Header, Body, Response
from datetime import datetime
from io import BytesIO
import html

from .deps import get_current_user
from database import supabase
from services.storage import get_storage_client

router = APIRouter()


def _verify_owner(project_id: str, user_id: str):
    proj = supabase.table("projects").select("user_id").eq("id", project_id).execute()
    if not proj.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if proj.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


def _doc_path(project_id: str) -> str:
    return f"documents/{project_id}.json"


@router.put("/{project_id}/document")
async def save_document(
    project_id: str,
    document: dict = Body(...),
    authorization: str = Header(None),
):
    """Persist the composer document for a project."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        storage = get_storage_client()
        url = await storage.upload_json(_doc_path(project_id), document)
        # Sync the editor's title back to the projects table so "My Portfolios"
        # (which reads project.title) reflects renames made inside the editor.
        update_fields = {"updated_at": datetime.utcnow().isoformat()}
        doc_title = document.get("title")
        if isinstance(doc_title, str) and doc_title.strip():
            update_fields["title"] = doc_title.strip()
        supabase.table("projects").update(update_fields).eq("id", project_id).execute()
        return {"ok": True, "url": url}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to save document: {e}")


@router.get("/{project_id}/document")
async def get_document(project_id: str, authorization: str = Header(None)):
    """Load the composer document for a project (or exists=false)."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        doc = await get_storage_client().download_json(_doc_path(project_id))
        return {"exists": doc is not None, "document": doc}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to load document: {e}")


@router.post("/{project_id}/document/health")
async def check_storage_health(project_id: str, authorization: str = Header(None)):
    """Check if storage is healthy (can write JSON documents). Used by frontend to validate config."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        storage = get_storage_client()
        # Try to write a tiny health-check document
        test_doc = {"health": "ok", "timestamp": datetime.utcnow().isoformat()}
        test_path = f"_health/{project_id}.json"
        await storage.upload_json(test_path, test_doc)
        return {"ok": True, "message": "Storage is healthy"}
    except Exception as e:
        error_msg = str(e).lower()
        if "permission" in error_msg or "denied" in error_msg:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Storage access denied. Check bucket configuration.")
        if "bucket" in error_msg or "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage bucket not found.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Storage error: {str(e)[:100]}")


@router.post("/{project_id}/document/export-pdf")
async def export_document_as_pdf(project_id: str, authorization: str = Header(None)):
    """Export composer document as PDF (A4 size)."""
    current_user = get_current_user(authorization)
    _verify_owner(project_id, current_user["user_id"])
    try:
        # Load document
        doc = await get_storage_client().download_json(_doc_path(project_id))
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No document found. Save your portfolio first.")

        # Check export limit (supabase is imported at module level)
        user_resp = supabase.table("users").select("export_count").eq("id", current_user["user_id"]).execute()
        export_count = 0
        if user_resp.data:
            export_count = user_resp.data[0].get("export_count") or 0
            if export_count >= 3:
                raise HTTPException(status_code=403, detail="FREE_TIER_LIMIT_REACHED")

        # Simple HTML-to-PDF rendering (basic)
        # In production, use WeasyPrint or similar
        html_content = _render_document_to_html(doc)

        from services.pdf_export import generate_pdf_from_html
        
        publishing = doc.get('publishing', {}) or {}
        page_size = publishing.get('pageSize', {}) or {}
        width_mm = page_size.get('width', 210)
        height_mm = page_size.get('height', 297)
        
        pdf_options = {
            'format': 'A4', # Default, will be overridden by custom width/height if supported
            'width': f'{width_mm}mm',
            'height': f'{height_mm}mm',
            'margin': {'top': '0mm', 'right': '0mm', 'bottom': '0mm', 'left': '0mm'},
            'printBackground': True,
        }
        
        pdf_bytes = await generate_pdf_from_html(
            html_content, 
            title=doc.get('title', 'Portfolio'),
            options=pdf_options
        )
        
        # Increment export count on success
        if user_resp.data:
            supabase.table("users").update({"export_count": export_count + 1}).eq("id", current_user["user_id"]).execute()
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={doc.get('title', 'portfolio').replace(' ', '_')}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"PDF export failed: {str(e)[:100]}")


def _render_document_to_html(doc: dict) -> str:
    """Render composer document to HTML for PDF export with advanced styling."""
    title = html.escape(doc.get('title', 'Portfolio'))
    tokens = doc.get('tokens', {})
    pages = doc.get('pages', [])

    publishing = doc.get('publishing', {}) or {}
    page_size = publishing.get('pageSize', {}) or {}
    width_mm = page_size.get('width', 210)
    height_mm = page_size.get('height', 297)

    bg = tokens.get('background', '#ffffff')
    text_color = tokens.get('text', '#1a1a1a')
    primary = tokens.get('primary', '#111111')
    accent = tokens.get('accent', '#888888')
    heading_font = tokens.get('headingFont', 'Georgia, serif')
    body_font = tokens.get('bodyFont', 'system-ui, -apple-system, sans-serif')

    html_parts = [
        '<!DOCTYPE html><html><head>',
        '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{title}</title>',
        '<style>',
        '  * { margin: 0; padding: 0; box-sizing: border-box; }',
        f'  html, body {{ font-family: {body_font}; background: {bg}; color: {text_color}; line-height: 1.6; }}',
        f'  .portfolio {{ width: {width_mm}mm; margin: 0 auto; }}',
        f'  .page {{ page-break-after: always; padding: 20mm; min-height: {height_mm}mm; background: {bg}; }}',
        '  .page:first-child { page-break-before: avoid; }',
        f'  h1 {{ font-family: {heading_font}; color: {primary}; font-size: 42px; font-weight: 600; line-height: 1.2; margin-bottom: 20px; }}',
        f'  h2 {{ font-family: {heading_font}; color: {accent}; font-size: 28px; font-weight: 500; margin-top: 30px; margin-bottom: 15px; }}',
        f'  .subtitle {{ color: {accent}; font-size: 18px; margin-bottom: 30px; }}',
        '  .section-title { border-bottom: 2px solid ' + accent + '; padding-bottom: 10px; margin-bottom: 20px; }',
        '  p { font-size: 14px; margin-bottom: 12px; color: ' + text_color + '; }',
        '  figure { margin: 20px 0; }',
        '  img { max-width: 100%; height: auto; border: 1px solid #eee; }',
        '  figcaption { font-size: 12px; color: #666; margin-top: 8px; font-style: italic; }',
        '  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.02); border-left: 3px solid ' + accent + '; }',
        '  .meta-item { }',
        '  .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 600; }',
        '  .meta-value { font-size: 16px; font-weight: 500; margin-top: 5px; }',
        '  .legend { margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.03); border-radius: 4px; }',
        '  .legend-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 10px; }',
        '  .legend-item { font-size: 13px; margin-bottom: 6px; }',
        '  .legend-key { display: inline-block; min-width: 24px; padding: 2px 6px; background: ' + accent + '; color: white; border-radius: 2px; font-weight: 600; margin-right: 8px; }',
        f'  @page {{ size: {width_mm}mm {height_mm}mm; margin: 0; }}',
        '  @media print { body { background: white; margin: 0; padding: 0; } .page { background: white; } }',
        '</style></head><body>',
        '<div class="portfolio">',
    ]

    for page_num, page in enumerate(pages):
        html_parts.append('<div class="page">')
        page_type = page.get('type', 'project')

        blocks = page.get('blocks', [])
        for block_idx, block in enumerate(blocks):
            btype = block.get('type')
            text = block.get('text', '')

            if btype == 'title':
                html_parts.append(f'<h1>{html.escape(text)}</h1>')
            elif btype == 'subtitle':
                html_parts.append(f'<p class="subtitle">{html.escape(text)}</p>')
            elif btype == 'description':
                formatted = html.escape(text).replace('\n', '<br>')
                html_parts.append(f'<p>{formatted}</p>')
            elif btype == 'meta':
                fields = block.get('fields', [])
                if fields:
                    html_parts.append('<div class="meta">')
                    for field in fields:
                        label = html.escape(field.get('label', ''))
                        value = html.escape(field.get('value', ''))
                        html_parts.append(f'<div class="meta-item"><div class="meta-label">{label}</div><div class="meta-value">{value}</div></div>')
                    html_parts.append('</div>')
            elif btype == 'legend':
                label = html.escape(block.get('label', 'LEGEND'))
                items = block.get('legendItems', [])
                if items:
                    html_parts.append(f'<div class="legend"><div class="legend-title">{label}</div>')
                    for item in items:
                        key = html.escape(item.get('key', ''))
                        item_label = html.escape(item.get('label', ''))
                        html_parts.append(f'<div class="legend-item"><span class="legend-key">{key}</span>{item_label}</div>')
                    html_parts.append('</div>')
            elif btype in ('render', 'plan', 'section', 'diagram'):
                url = block.get('imageUrl', '')
                if url:
                    img_label = html.escape(block.get('label', f'{btype.title()}'))
                    scale = block.get('scale', '')
                    if scale:
                        img_label += f' • {html.escape(scale)}'
                    url_safe = html.escape(url)
                    html_parts.append(f'<figure><img src="{url_safe}" alt="{img_label}" loading="lazy"><figcaption>{img_label}</figcaption></figure>')

        html_parts.append('</div>')

    html_parts.extend(['</div></body></html>'])
    return ''.join(html_parts)
