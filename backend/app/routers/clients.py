from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.client import Client
from app.schemas.client import Client as ClientSchema, ClientCreate, ClientUpdate, ClientWithQuotes
from app.auth.jwt import get_current_active_user, TokenData

router = APIRouter()

@router.post("/", response_model=ClientSchema, status_code=status.HTTP_201_CREATED)
async def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Create a new client."""
    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/", response_model=List[ClientSchema])
async def read_clients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, min_length=3, description="Search in name, email, or phone"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Get all clients with optional search."""
    query = db.query(Client)
    
    # Apply search filter if provided
    if search:
        query = query.filter(
            Client.name.ilike(f"%{search}%") |
            Client.email.ilike(f"%{search}%") |
            Client.phone_number.ilike(f"%{search}%")
        )
    
    return query.offset(skip).limit(limit).all()

@router.get("/{client_id}", response_model=ClientWithQuotes)
async def read_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Get a specific client by ID."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.put("/{client_id}", response_model=ClientSchema)
async def update_client(
    client_id: int,
    client: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Update a client."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
    
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """Delete a client."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return None
