"""
Portfolio document persistence.

Stores the full composer document (pages, blocks, design tokens) as a JSON
file in Supabase Storage, keyed by project id. No schema migration required.
"""
from fastapi import APIRouter, HTTPException, status, Header, Body
from fastapi.responses import FileResponse
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
        supabase.table("projects").update(
            {"updated_at": datetime.utcnow().isoformat()}
        ).eq("id", project_id).execute()
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

        # Simple HTML-to-PDF rendering (basic)
        # In production, use WeasyPrint or similar
        html_content = _render_document_to_html(doc)

        # Try to use pdfkit/wkhtmltopdf if available, otherwise return HTML
        try:
            import pdfkit
            pdf_bytes = pdfkit.from_string(html_content, False, options={'page-size': 'A4'})
            if pdf_bytes:
                return FileResponse(
                    BytesIO(pdf_bytes),
                    media_type="application/pdf",
                    filename=f"{doc.get('title', 'portfolio').replace(' ', '_')}.pdf"
                )
        except ImportError:
            pass

        # Fallback: return HTML with CSS for printing
        return FileResponse(
            BytesIO(html_content.encode()),
            media_type="text/html",
            filename=f"{doc.get('title', 'portfolio').replace(' ', '_')}.html"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"PDF export failed: {str(e)[:100]}")


def _render_document_to_html(doc: dict) -> str:
    """Render composer document to HTML for PDF export."""
    title = html.escape(doc.get('title', 'Portfolio'))
    tokens = doc.get('tokens', {})
    pages = doc.get('pages', [])

    html_parts = [
        '<!DOCTYPE html><html><head>',
        '<meta charset="UTF-8"><meta name="viewport" content="width=device-width">',
        '<title>' + title + '</title>',
        '<style>',
        '  * { margin: 0; padding: 0; box-sizing: border-box; }',
        '  body { font-family: Arial, sans-serif; background: ' + tokens.get('background', '#fff') + '; color: ' + tokens.get('text', '#000') + '; }',
        '  .page { page-break-after: always; padding: 40px; min-height: 297mm; }',
        '  h1 { color: ' + tokens.get('primary', '#000') + '; font-size: 36px; margin: 20px 0; }',
        '  h2 { color: ' + tokens.get('accent', '#666') + '; font-size: 24px; margin: 15px 0; }',
        '  p { font-size: 14px; line-height: 1.6; margin: 10px 0; }',
        '  img { max-width: 100%; height: auto; margin: 10px 0; }',
        '  @media print { body { background: white; } }',
        '</style></head><body>',
        f'<div class="page"><h1>{title}</h1>',
    ]

    for page in pages:
        if page.get('type') == 'cover':
            html_parts.append('<div style="page-break-before: always;"></div>')

        for block in page.get('blocks', []):
            btype = block.get('type')
            if btype in ('title', 'subtitle'):
                tag = 'h1' if btype == 'title' else 'h2'
                text = html.escape(block.get('text', ''))
                html_parts.append(f'<{tag}>{text}</{tag}>')
            elif btype == 'description':
                text = html.escape(block.get('text', '')).replace('\n', '<br>')
                html_parts.append(f'<p>{text}</p>')
            elif btype == 'render' and block.get('imageUrl'):
                url = html.escape(block.get('imageUrl', ''))
                label = html.escape(block.get('label', ''))
                html_parts.append(f'<figure><img src="{url}" alt="{label}"><figcaption>{label}</figcaption></figure>')
            elif btype == 'meta':
                for field in block.get('fields', []):
                    label = html.escape(field.get('label', ''))
                    value = html.escape(field.get('value', ''))
                    html_parts.append(f'<p><strong>{label}:</strong> {value}</p>')

    html_parts.extend(['</div></body></html>'])
    return ''.join(html_parts)
