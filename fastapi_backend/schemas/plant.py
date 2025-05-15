from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class PlantBase(BaseModel):
    name: str = Field(..., description="Name of the plant")
    location: Optional[str] = Field(None, description="Location of the plant")
    description: Optional[str] = Field(None, description="Description of the plant")

class PlantCreate(PlantBase):
    pass

class PlantUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class Plant(PlantBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PlantInDB(Plant):
    created_at: datetime
    updated_at: datetime

