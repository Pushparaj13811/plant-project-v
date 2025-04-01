from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from decimal import Decimal

from app.schemas.plant import PlantInDB

# Base schemas (used for shared attributes)
class FormulaVariableBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    value: Decimal
    default_value: Decimal

class PlantRecordBase(BaseModel):
    plant_id: int
    
    # Common Fields (General Information)
    date: date
    code: str
    product: str
    truck_no: str
    bill_no: str
    party_name: str
    
    # Input Variables
    rate: Decimal
    mv: Decimal
    oil: Decimal
    fiber: Decimal
    starch: Decimal
    maize_rate: Decimal

# Create schemas (used for creating new objects)
class FormulaVariableCreate(FormulaVariableBase):
    pass

class PlantRecordCreate(PlantRecordBase):
    pass

# Update schemas (used for updating existing objects)
class FormulaVariableUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    value: Optional[Decimal] = None

class PlantRecordUpdate(BaseModel):
    date: Optional[date] = None
    code: Optional[str] = None
    product: Optional[str] = None
    truck_no: Optional[str] = None
    bill_no: Optional[str] = None
    party_name: Optional[str] = None
    
    # Only input variables can be updated
    rate: Optional[Decimal] = None
    mv: Optional[Decimal] = None
    oil: Optional[Decimal] = None
    fiber: Optional[Decimal] = None
    starch: Optional[Decimal] = None
    maize_rate: Optional[Decimal] = None

# DB schemas (returned from API)
class FormulaVariableInDB(FormulaVariableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class PlantRecordInDB(PlantRecordBase):
    id: int
    
    # Dry Variables (Calculated)
    dm: Decimal
    rate_on_dm: Decimal
    oil_value: Decimal
    net_wo_oil_fiber: Decimal
    starch_per_point: Decimal
    starch_value: Decimal
    grain: Decimal
    doc: Decimal
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class PlantRecordWithPlant(PlantRecordInDB):
    plant: PlantInDB

# Statistics schema
class PlantRecordDateRange(BaseModel):
    min: Optional[date] = None
    max: Optional[date] = None

class PlantRecordAverages(BaseModel):
    rate: Optional[Decimal] = None
    mv: Optional[Decimal] = None
    oil: Optional[Decimal] = None
    fiber: Optional[Decimal] = None
    starch: Optional[Decimal] = None
    maize_rate: Optional[Decimal] = None
    dm: Optional[Decimal] = None
    rate_on_dm: Optional[Decimal] = None
    oil_value: Optional[Decimal] = None
    net_wo_oil_fiber: Optional[Decimal] = None
    starch_per_point: Optional[Decimal] = None
    starch_value: Optional[Decimal] = None
    grain: Optional[Decimal] = None
    doc: Optional[Decimal] = None

class PlantRecordStatistics(BaseModel):
    total_records: int
    date_range: PlantRecordDateRange
    averages: PlantRecordAverages

# Column info schemas
class ColumnInfo(BaseModel):
    name: str
    label: str
    type: str  # 'number', 'text', 'date'

class ColumnCategories(BaseModel):
    input_variables: List[ColumnInfo]
    dry_variables: List[ColumnInfo]
    general_info: List[ColumnInfo]

# Chat schemas
class ChatRequest(BaseModel):
    message: str
    plant_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ChatResponse(BaseModel):
    message: str
    data: Optional[Dict[str, Any]] = None 