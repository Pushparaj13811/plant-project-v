from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, Boolean, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PlantRecord(Base):
    __tablename__ = "plant_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False, index=True)
    
    # General info
    code = Column(String(50), index=True)
    product = Column(String(100))
    truck_no = Column(String(50))
    bill_no = Column(String(50))
    party_name = Column(String(100))
    
    # Input variables
    rate = Column(Numeric(10, 2), nullable=True)
    mv = Column(Numeric(10, 2), nullable=True)
    oil = Column(Numeric(10, 2), nullable=True)
    fiber = Column(Numeric(10, 2), nullable=True)
    starch = Column(Numeric(10, 2), nullable=True)
    maize_rate = Column(Numeric(10, 2), nullable=True)
    
    # Calculated fields
    dm = Column(Numeric(10, 2), nullable=True)
    rate_on_dm = Column(Numeric(10, 2), nullable=True)
    oil_value = Column(Numeric(10, 2), nullable=True)
    net_wo_oil_fiber = Column(Numeric(10, 2), nullable=True)
    starch_per_point = Column(Numeric(10, 2), nullable=True)
    starch_value = Column(Numeric(10, 2), nullable=True)
    grain = Column(Numeric(10, 2), nullable=True)
    doc = Column(Numeric(10, 2), nullable=True)
    
    # Additional notes or metadata
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    plant = relationship("Plant", back_populates="records")
    
    def __repr__(self):
        return f"<PlantRecord {self.date} for plant {self.plant_id}>"
    
    def calculate_derived_values(self, variables):
        """
        Calculate derived values based on formula variables
        """
        # Extract variables needed for calculations
        mv_value = float(self.mv) if self.mv is not None else None
        rate_value = float(self.rate) if self.rate is not None else None
        oil_value_pct = float(self.oil) if self.oil is not None else None
        fiber_value = float(self.fiber) if self.fiber is not None else None
        starch_value = float(self.starch) if self.starch is not None else None
        
        # Get formula variables
        dm_factor = float(variables.get("dm_factor", 100))
        oil_factor = float(variables.get("oil_factor", 1))
        net_wo_factor = float(variables.get("net_wo_factor", 1))
        starch_per_point_factor = float(variables.get("starch_per_point_factor", 1))
        grain_factor = float(variables.get("grain_factor", 1))
        doc_factor = float(variables.get("doc_factor", 1))
        
        # Calculate DM (Dry Matter)
        if mv_value is not None:
            self.dm = 100 - mv_value
        
        # Calculate Rate on DM
        if rate_value is not None and self.dm is not None and float(self.dm) > 0:
            self.rate_on_dm = (rate_value * 100) / float(self.dm)
        
        # Calculate Oil Value
        if oil_value_pct is not None:
            self.oil_value = oil_value_pct * oil_factor
        
        # Calculate Net (without Oil & Fiber)
        if rate_value is not None and self.oil_value is not None and fiber_value is not None:
            self.net_wo_oil_fiber = rate_value - float(self.oil_value) - (fiber_value * net_wo_factor)
        
        # Calculate Starch Per Point
        if starch_value is not None and starch_value > 0:
            self.starch_per_point = starch_per_point_factor / starch_value
        
        # Calculate Starch Value
        if starch_value is not None and self.starch_per_point is not None:
            self.starch_value = starch_value * float(self.starch_per_point)
        
        # Calculate Grain
        if self.starch_value is not None:
            self.grain = float(self.starch_value) * grain_factor
        
        # Calculate DOC
        if self.starch_value is not None and self.oil_value is not None:
            self.doc = (float(self.starch_value) + float(self.oil_value)) * doc_factor


class FormulaVariable(Base):
    __tablename__ = "formula_variables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    value = Column(Numeric(10, 4), nullable=False)
    default_value = Column(Numeric(10, 4), nullable=False)
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<FormulaVariable {self.name} = {self.value}>"
    
    def reset_to_default(self):
        """
        Reset the value to default value
        """
        self.value = self.default_value 