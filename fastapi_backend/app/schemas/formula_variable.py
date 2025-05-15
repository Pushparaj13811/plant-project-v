from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class FormulaVariableBase(BaseModel):
    name: str = Field(..., description="Unique name identifier for the variable")
    value: Decimal = Field(..., description="Current value of the formula variable")
    description: Optional[str] = Field(None, description="Description of what this variable is used for")
    
    @validator('name')
    def name_must_be_valid(cls, v):
        if not v or not v.isalnum():
            raise ValueError('name must be alphanumeric')
        return v.lower()  # Store names in lowercase for consistency


class FormulaVariableCreate(FormulaVariableBase):
    default_value: Decimal = Field(..., description="Default value to reset to")


class FormulaVariableUpdate(BaseModel):
    value: Optional[Decimal] = None
    description: Optional[str] = None
    default_value: Optional[Decimal] = None


class FormulaVariableInDBBase(FormulaVariableBase):
    id: int
    default_value: Decimal = Field(..., description="Default value to reset to")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


class FormulaVariableInDB(FormulaVariableInDBBase):
    pass 