"""Portfolio Builder API - FastAPI backend"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI()

class PortfolioConfig(BaseModel):
    title: str
    architectName: str
    totalPages: int
    projectCount: int
    stylePackId: str

class PageConfig(BaseModel):
    pageNumber: int
    pageType: str
    layoutId: str
    content: dict

class OverlayConfig(BaseModel):
    type: str
    enabled: bool
    settings: dict

# Storage (would be replaced with database)
portfolios = {}
pages_by_portfolio = {}

@app.post("/api/portfolios")
def create_portfolio(config: PortfolioConfig):
    portfolio_id = f"portfolio-{datetime.now().timestamp()}"
    portfolios[portfolio_id] = config
    pages_by_portfolio[portfolio_id] = []
    return {"id": portfolio_id, **config.dict()}

@app.get("/api/portfolios/{portfolio_id}")
def get_portfolio(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"id": portfolio_id, **portfolios[portfolio_id].dict()}

@app.patch("/api/portfolios/{portfolio_id}")
def update_portfolio(portfolio_id: str, config: PortfolioConfig):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    portfolios[portfolio_id] = config
    return {"id": portfolio_id, **config.dict()}

@app.delete("/api/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    del portfolios[portfolio_id]
    del pages_by_portfolio[portfolio_id]
    return {"deleted": True}

@app.post("/api/portfolios/{portfolio_id}/pages")
def create_page(portfolio_id: str, page: PageConfig):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    page_id = f"page-{datetime.now().timestamp()}"
    pages_by_portfolio[portfolio_id].append({"id": page_id, **page.dict()})
    return {"id": page_id, **page.dict()}

@app.get("/api/portfolios/{portfolio_id}/pages")
def get_pages(portfolio_id: str):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return pages_by_portfolio[portfolio_id]

@app.post("/api/portfolios/{portfolio_id}/pages/batch")
def batch_create_pages(portfolio_id: str, pages: List[PageConfig]):
    if portfolio_id not in portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    created = []
    for page in pages:
        page_id = f"page-{datetime.now().timestamp()}"
        pages_by_portfolio[portfolio_id].append({"id": page_id, **page.dict()})
        created.append({"id": page_id, **page.dict()})
    return created

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
