from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.quote import Quote
from app.schemas.quote import Quote as QuoteSchema, QuoteCreate, QuoteUpdate, QuoteWithDocuments
from app.auth.jwt import get_current_active_user, TokenData

router = APIRouter()

@router.post("/", response_model=QuoteSchema, status_code=status.HTTP_201_CREATED)
async def create_quote(
    quote: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Create a new quote."""
    db_quote = Quote(**quote.model_dump())
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.get("/", response_model=List[QuoteSchema])
async def read_quotes(
    skip: int = 0,
    limit: int = 100,
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Get all quotes with optional client_id filter."""
    query = db.query(Quote)
    
    # Filter by client_id if provided
    if client_id:
        query = query.filter(Quote.client_id == client_id)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{quote_id}", response_model=QuoteWithDocuments)
async def read_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Get a specific quote by ID."""
    db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    return db_quote

@router.put("/{quote_id}", response_model=QuoteSchema)
async def update_quote(
    quote_id: int,
    quote: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Update a quote."""
    db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    update_data = quote.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_quote, key, value)
    
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Delete a quote."""
    db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    db.delete(db_quote)
    db.commit()
    return None
