from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from typing import Any, List, Optional, Dict, Union
from datetime import date

from app.core.database import get_db
from app.crud import plant_record
from app.schemas import (
    PlantRecordCreate, PlantRecordUpdate, PlantRecordInDB, 
    PlantRecordStatistics, ColumnCategories, PlantRecordPagination
)
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=Union[List[PlantRecordInDB], PlantRecordPagination])
def read_plant_records(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    response: Response,
    plant_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: Optional[int] = Query(None, description="Page number for pagination"),
    per_page: Optional[int] = Query(None, description="Items per page for pagination"),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve plant records with filtering and pagination
    """
    # Handle plant-specific access control
    if not current_user.is_superuser:
        if current_user.role.category == "admin":
            # Admin can only access their assigned plant's records
            if current_user.plant_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin user is not assigned to any plant"
                )
            if plant_id and plant_id != current_user.plant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin can only access their assigned plant's records"
                )
            plant_id = current_user.plant_id
        elif current_user.role.category == "user":
            # Regular user can only access their assigned plant's records
            if current_user.plant_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is not assigned to any plant"
                )
            if plant_id and plant_id != current_user.plant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User can only access their assigned plant's records"
                )
            plant_id = current_user.plant_id

    # If explicit pagination parameters are provided, use them
    if page is not None and per_page is not None:
        skip = (page - 1) * per_page
        limit = per_page
    
    records = plant_record.get_filtered(
        db, 
        plant_id=plant_id, 
        start_date=start_date, 
        end_date=end_date, 
        skip=skip, 
        limit=limit
    )
    
    total = plant_record.get_count(
        db, 
        plant_id=plant_id, 
        start_date=start_date, 
        end_date=end_date
    )
    
    # Add pagination headers
    if page is not None and per_page is not None:
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Page"] = str(page)
        response.headers["X-Per-Page"] = str(per_page)
        response.headers["X-Next"] = str(page < (total // per_page) + 1).lower()
        response.headers["X-Previous"] = str(page > 1).lower()
        
        # Return paginated response with metadata in a format similar to Django
        return {
            "results": records,
            "count": total,
            "next": page < (total // per_page) + 1,
            "previous": page > 1
        }
    
    return records

@router.post("/", response_model=PlantRecordInDB)
def create_plant_record(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    plant_record_in: PlantRecordCreate,
) -> Any:
    """
    Create new plant record
    """
    # Handle plant-specific access control for record creation
    if not current_user.is_superuser:
        if current_user.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any plant"
            )
        if plant_record_in.plant_id != current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User can only create records for their assigned plant"
            )

    record = plant_record.create(db, obj_in=plant_record_in)
    return record

@router.get("/{id}", response_model=PlantRecordInDB)
def read_plant_record(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    id: int,
) -> Any:
    """
    Get plant record by ID
    """
    record = plant_record.get(db, id=id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant record not found",
        )

    # Handle plant-specific access control
    if not current_user.is_superuser:
        if current_user.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any plant"
            )
        if record.plant_id != current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User can only access records from their assigned plant"
            )

    return record

@router.patch("/{id}", response_model=PlantRecordInDB)
def update_plant_record(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    id: int,
    plant_record_in: PlantRecordUpdate,
) -> Any:
    """
    Update plant record
    """
    record = plant_record.get(db, id=id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant record not found",
        )
    
    # Handle plant-specific access control
    if not current_user.is_superuser:
        if current_user.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any plant"
            )
        if record.plant_id != current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User can only update records from their assigned plant"
            )
    
    # Update plant record
    record = plant_record.update(db, db_obj=record, obj_in=plant_record_in)
    return record

@router.delete("/{id}", response_model=PlantRecordInDB)
def delete_plant_record(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    id: int,
) -> Any:
    """
    Delete plant record
    """
    record = plant_record.get(db, id=id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant record not found",
        )
    
    # Handle plant-specific access control
    if not current_user.is_superuser:
        if current_user.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any plant"
            )
        if record.plant_id != current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User can only delete records from their assigned plant"
            )
    
    # Delete plant record
    record = plant_record.remove(db, id=id)
    return record

@router.get("/statistics", response_model=Dict)
def get_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    plant_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Any:
    """
    Get statistics for plant records
    """
    queryset = plant_record.get_filtered(
        db, 
        plant_id=plant_id, 
        start_date=start_date, 
        end_date=end_date,
        skip=0,
        limit=None  # Get all matching records
    )
    
    count = plant_record.get_count(
        db, 
        plant_id=plant_id, 
        start_date=start_date, 
        end_date=end_date
    )
    
    # Calculate statistics similar to Django backend
    stats = plant_record.get_statistics(
        db, 
        plant_id=plant_id, 
        start_date=start_date, 
        end_date=end_date
    )
    
    # Format the response to match Django
    return {
        "total_records": count,
        "date_range": {
            "min": stats.get("date_range", {}).get("start"),
            "max": stats.get("date_range", {}).get("end")
        },
        "averages": {
            "rate": stats.get("avg_rate"),
            "mv": stats.get("avg_mv"),
            "oil": stats.get("avg_oil"),
            "fiber": stats.get("avg_fiber"),
            "starch": stats.get("avg_starch"),
            "maize_rate": stats.get("avg_maize_rate"),
            "dm": stats.get("avg_dm"),
            "rate_on_dm": stats.get("avg_rate_on_dm"),
            "oil_value": stats.get("avg_oil_value"),
            "net_wo_oil_fiber": stats.get("avg_net_wo_oil_fiber"),
            "starch_per_point": stats.get("avg_starch_per_point"),
            "starch_value": stats.get("avg_starch_value"),
            "grain": stats.get("avg_grain"),
            "doc": stats.get("avg_doc"),
        }
    }

@router.get("/available_columns", response_model=ColumnCategories)
def get_available_columns(
    *,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get available columns for plant records
    """
    # Define column categories
    column_categories = {
        'input_variables': [
            {'name': 'rate', 'label': 'Rate', 'type': 'number'},
            {'name': 'mv', 'label': 'Mv', 'type': 'number'},
            {'name': 'oil', 'label': 'Oil', 'type': 'number'},
            {'name': 'fiber', 'label': 'Fiber', 'type': 'number'},
            {'name': 'starch', 'label': 'Starch', 'type': 'number'},
            {'name': 'maize_rate', 'label': 'Maize Rate', 'type': 'number'},
        ],
        'dry_variables': [
            {'name': 'dm', 'label': 'DM', 'type': 'number'},
            {'name': 'rate_on_dm', 'label': 'Rate on DM', 'type': 'number'},
            {'name': 'oil_value', 'label': 'Oil Value', 'type': 'number'},
            {'name': 'net_wo_oil_fiber', 'label': 'Net (wo Oil & Fiber)', 'type': 'number'},
            {'name': 'starch_per_point', 'label': 'Starch Per Point', 'type': 'number'},
            {'name': 'starch_value', 'label': 'Starch Value', 'type': 'number'},
            {'name': 'grain', 'label': 'Grain', 'type': 'number'},
            {'name': 'doc', 'label': 'DOC', 'type': 'number'},
        ],
        'general_info': [
            {'name': 'date', 'label': 'Date', 'type': 'date'},
            {'name': 'code', 'label': 'Code', 'type': 'text'},
            {'name': 'product', 'label': 'Product', 'type': 'text'},
            {'name': 'truck_no', 'label': 'Truck No', 'type': 'text'},
            {'name': 'bill_no', 'label': 'Bill No', 'type': 'text'},
            {'name': 'party_name', 'label': 'Party Name', 'type': 'text'},
        ]
    }
    
    return column_categories 