from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict, List

from app.core.database import get_db
from app.crud import formula_variable
from app.schemas import FormulaVariableInDB, FormulaVariableCreate, FormulaVariableUpdate
from app.api.dependencies.auth import get_current_active_user, get_current_superuser
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[FormulaVariableInDB])
def read_formula_variables(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve all formula variables.
    """
    variables = formula_variable.get_multi(db)
    return variables

@router.get("/{name}", response_model=FormulaVariableInDB)
def read_formula_variable(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    name: str,
) -> Any:
    """
    Get formula variable by name.
    """
    variable = formula_variable.get_by_name(db, name=name)
    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Formula variable '{name}' not found",
        )
    return variable

@router.post("/", response_model=FormulaVariableInDB)
def create_formula_variable(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    variable_in: FormulaVariableCreate,
) -> Any:
    """
    Create new formula variable. Only superusers can create variables.
    """
    # Check if variable with this name already exists
    variable = formula_variable.get_by_name(db, name=variable_in.name)
    if variable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Variable with name '{variable_in.name}' already exists",
        )
    
    variable = formula_variable.create(db, obj_in=variable_in)
    return variable

@router.put("/{name}", response_model=FormulaVariableInDB)
def update_formula_variable(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    name: str,
    variable_in: FormulaVariableUpdate,
) -> Any:
    """
    Update formula variable. Only superusers can update variables.
    """
    variable = formula_variable.get_by_name(db, name=name)
    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Formula variable '{name}' not found",
        )
    
    variable = formula_variable.update(db, db_obj=variable, obj_in=variable_in)
    return variable

@router.delete("/{name}", response_model=FormulaVariableInDB)
def delete_formula_variable(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    name: str,
) -> Any:
    """
    Delete formula variable. Only superusers can delete variables.
    """
    variable = formula_variable.get_by_name(db, name=name)
    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Formula variable '{name}' not found",
        )
    
    variable = formula_variable.remove(db, id=variable.id)
    return variable

@router.post("/reset", response_model=Dict[str, str])
def reset_variables(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Reset all formula variables to their default values. Only superusers can reset variables.
    """
    formula_variable.reset_all(db)
    return {"message": "All formula variables reset to default values"}

@router.post("/reset/{name}", response_model=FormulaVariableInDB)
def reset_variable(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    name: str,
) -> Any:
    """
    Reset a specific formula variable to its default value. Only superusers can reset variables.
    """
    variable = formula_variable.get_by_name(db, name=name)
    if not variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Formula variable '{name}' not found",
        )
    
    variable = formula_variable.reset(db, name=name)
    return variable 