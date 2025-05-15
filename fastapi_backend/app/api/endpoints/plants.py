from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.core.database import get_db
from app.crud import plant
from app.schemas import Plant, PlantCreate, PlantUpdate
from app.api.dependencies.auth import get_current_active_user, get_current_superuser
from app.models.user import User

router = APIRouter()
# Create a separate router for plants to be used in the /management/plants endpoint
management_router = APIRouter()

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
    Retrieve plants with role-based access control:
    - Super Admin: Can see all plants
    - Admin: Can see only their assigned plants
    - User: Can see only their assigned plants
    """
    if current_user.is_superuser:
        # Super Admin can see all plants
        plants = plant.get_multi(
            db, 
            skip=skip, 
            limit=limit,
            is_active=is_active
        )
    else:
        # Admin and User can only see their assigned plants
        if not current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any plant"
            )
        plants = plant.get_multi(
            db,
            skip=skip,
            limit=limit,
            is_active=is_active,
            id=current_user.plant_id
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
    Get plant by ID with role-based access control:
    - Super Admin: Can see any plant
    - Admin: Can see only their assigned plants
    - User: Can see only their assigned plants
    """
    db_plant = plant.get(db, id=id)
    if not db_plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    
    # Check if user has access to this plant
    if not current_user.is_superuser and current_user.plant_id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this plant"
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
    
    return plant.remove(db, id=id)

# Duplicate plant endpoints for /management/plants path
@management_router.get("/", response_model=List[Plant])
def management_read_plants(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> Any:
    """
    Retrieve plants via management endpoint.
    """
    # Handle role-based access control
    if current_user.is_superuser:
        # Superusers can see all plants
        plants = plant.get_multi(
            db, 
            skip=skip, 
            limit=limit,
            is_active=is_active
        )
    else:
        # Regular users and admins can only see their assigned plant
        if current_user.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any plant"
            )
        plants = plant.get_multi(
            db,
            skip=skip,
            limit=limit,
            is_active=is_active,
            id=current_user.plant_id
        )
    
    return plants

@management_router.post("/", response_model=Plant)
def management_create_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    plant_in: PlantCreate,
) -> Any:
    """
    Create new plant via management endpoint. Only superusers can create plants.
    """
    # Check if plant with this name already exists
    db_plant = plant.get_by_name(db, name=plant_in.name)
    if db_plant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plant with name '{plant_in.name}' already exists",
        )
    
    return plant.create(db, obj_in=plant_in)

@management_router.get("/{id}", response_model=Plant)
def management_read_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    id: int,
) -> Any:
    """
    Get plant by ID via management endpoint.
    """
    db_plant = plant.get(db, id=id)
    if not db_plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    return db_plant

@management_router.put("/{id}", response_model=Plant)
def management_update_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    id: int,
    plant_in: PlantUpdate,
) -> Any:
    """
    Update plant via management endpoint. Only superusers can update plants.
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

@management_router.delete("/{id}", response_model=Plant)
def management_delete_plant(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    id: int,
) -> Any:
    """
    Delete plant via management endpoint. Only superusers can delete plants.
    """
    db_plant = plant.get(db, id=id)
    if not db_plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    
    return plant.remove(db, id=id) 