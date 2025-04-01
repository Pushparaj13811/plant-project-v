from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.core.database import get_db
from app.crud import plant
from app.schemas import Plant, PlantCreate, PlantUpdate
from app.api.dependencies.auth import get_current_active_user, get_current_superuser
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Plant])
def read_plants(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> Any:
    """
    Retrieve plants with optional filtering by active status.
    """
    plants = plant.get_multi(
        db, 
        skip=skip, 
        limit=limit,
        is_active=is_active
    )
    return plants

@router.post("/", response_model=Plant)
def create_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    plant_in: PlantCreate,
) -> Any:
    """
    Create new plant. Only superusers can create plants.
    """
    # Check if plant with this name already exists
    db_plant = plant.get_by_name(db, name=plant_in.name)
    if db_plant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plant with name '{plant_in.name}' already exists",
        )
    
    return plant.create(db, obj_in=plant_in)

@router.get("/{id}", response_model=Plant)
def read_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    id: int,
) -> Any:
    """
    Get plant by ID.
    """
    db_plant = plant.get(db, id=id)
    if not db_plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    return db_plant

@router.put("/{id}", response_model=Plant)
def update_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    id: int,
    plant_in: PlantUpdate,
) -> Any:
    """
    Update plant. Only superusers can update plants.
    """
    db_plant = plant.get(db, id=id)
    if not db_plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    
    # If name is being changed, check if it conflicts with existing plant
    if plant_in.name and plant_in.name != db_plant.name:
        existing_plant = plant.get_by_name(db, name=plant_in.name)
        if existing_plant and existing_plant.id != id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plant with name '{plant_in.name}' already exists",
            )
    
    return plant.update(db, db_obj=db_plant, obj_in=plant_in)

@router.delete("/{id}", response_model=Plant)
def delete_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    id: int,
) -> Any:
    """
    Delete plant. Only superusers can delete plants.
    """
    db_plant = plant.get(db, id=id)
    if not db_plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    
    # Instead of actually deleting, just mark as inactive
    db_plant = plant.update(db, db_obj=db_plant, obj_in={"is_active": False})
    return db_plant 