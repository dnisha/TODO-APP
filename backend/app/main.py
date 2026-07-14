from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, crud

# Automatically create the database tables if they do not exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database table creation skipped or failed (DB might be offline): {e}")

app = FastAPI(
    title="TODO App API",
    description="FastAPI Backend for Todo Application with MySQL database",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router for v1 prefix
api_router = APIRouter(prefix="/api/v1")

@api_router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check endpoint to ensure API service is running.
    """
    return {"status": "healthy"}

@api_router.get("/db-test")
def test_db_connection(db: Session = Depends(get_db)):
    """
    Endpoint to verify connection health of the underlying MySQL database.
    """
    try:
        # Execute simple query to test connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Database connection is operational"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )

# CRUD Endpoints

@api_router.get("/todos", response_model=List[schemas.TodoResponse])
def read_todos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetch all TODO items.
    """
    return crud.get_todos(db, skip=skip, limit=limit)

@api_router.get("/todos/{todo_id}", response_model=schemas.TodoResponse)
def read_todo(todo_id: int, db: Session = Depends(get_db)):
    """
    Fetch a single TODO item by ID.
    """
    db_todo = crud.get_todo(db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="TODO item not found")
    return db_todo

@api_router.post("/todos", response_model=schemas.TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    """
    Create a new TODO item.
    """
    return crud.create_todo(db=db, todo=todo)

@api_router.put("/todos/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(todo_id: int, todo_update: schemas.TodoUpdate, db: Session = Depends(get_db)):
    """
    Update an existing TODO item.
    """
    db_todo = crud.update_todo(db=db, todo_id=todo_id, todo_update=todo_update)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="TODO item not found")
    return db_todo

@api_router.delete("/todos/{todo_id}", response_model=schemas.TodoResponse)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """
    Delete a TODO item.
    """
    db_todo = crud.delete_todo(db=db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="TODO item not found")
    return db_todo

# Include the Router under the main application
app.include_router(api_router)
