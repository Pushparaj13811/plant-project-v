from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

class DashboardStats(BaseModel):
    totalUsers: int
    activeUsers: int
    totalPlants: int
    userGrowth: float

class DashboardActivity(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: str

class ChartDataset(BaseModel):
    label: str
    data: List[int]
    borderColor: str
    backgroundColor: str

class ChartData(BaseModel):
    labels: List[str]
    datasets: List[ChartDataset]

class DashboardResponse(BaseModel):
    stats: DashboardStats
    activities: List[DashboardActivity]
    chartData: ChartData

    class Config:
        from_attributes = True 