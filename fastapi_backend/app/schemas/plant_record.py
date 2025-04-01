from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Union
from datetime import date, datetime
from decimal import Decimal


class ColumnCategories(BaseModel):
    input_variables: List[Dict[str, str]]
    dry_variables: List[Dict[str, str]]
    general_info: List[Dict[str, str]]

class PlantRecordBase(BaseModel):
    date: date
    plant_id: int
    code: Optional[str] = None
    product: Optional[str] = None
    truck_no: Optional[str] = None
    bill_no: Optional[str] = None
    party_name: Optional[str] = None
    
    # Input variables
    rate: Optional[Decimal] = Field(None, description="Rate in rupees per kg")
    mv: Optional[Decimal] = Field(None, description="Moisture Value in percentage")
    oil: Optional[Decimal] = Field(None, description="Oil in percentage")
    fiber: Optional[Decimal] = Field(None, description="Fiber in percentage")
    starch: Optional[Decimal] = Field(None, description="Starch in percentage")
    maize_rate: Optional[Decimal] = Field(None, description="Maize Rate in rupees per kg")
    
    # Additional notes or metadata
    notes: Optional[str] = None


class PlantRecordCreate(PlantRecordBase):
    date: date
    plant_id: int


class PlantRecordUpdate(BaseModel):
    date: Optional[date] = None
    plant_id: Optional[int] = None
    code: Optional[str] = None
    product: Optional[str] = None
    truck_no: Optional[str] = None
    bill_no: Optional[str] = None
    party_name: Optional[str] = None
    
    # Input variables
    rate: Optional[Decimal] = None
    mv: Optional[Decimal] = None
    oil: Optional[Decimal] = None
    fiber: Optional[Decimal] = None
    starch: Optional[Decimal] = None
    maize_rate: Optional[Decimal] = None
    
    # Additional notes or metadata
    notes: Optional[str] = None


class PlantRecordInDBBase(PlantRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Derived values
    dm: Optional[Decimal] = None
    rate_on_dm: Optional[Decimal] = None
    oil_value: Optional[Decimal] = None
    net_wo_oil_fiber: Optional[Decimal] = None 
    starch_per_point: Optional[Decimal] = None
    starch_value: Optional[Decimal] = None
    grain: Optional[Decimal] = None
    doc: Optional[Decimal] = None
    
    class Config:
        orm_mode = True


class PlantRecordInDB(PlantRecordInDBBase):
    pass


class PlantRecordStatistics(BaseModel):
    count: int
    avg_rate: Optional[Decimal] = None
    avg_mv: Optional[Decimal] = None
    avg_oil: Optional[Decimal] = None
    avg_fiber: Optional[Decimal] = None
    avg_starch: Optional[Decimal] = None
    avg_dm: Optional[Decimal] = None
    avg_rate_on_dm: Optional[Decimal] = None
    min_rate: Optional[Decimal] = None
    max_rate: Optional[Decimal] = None
    date_range: Optional[Dict[str, date]] = None 