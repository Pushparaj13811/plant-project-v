from typing import Dict, List, Any, Optional, Union, TypeVar, Generic, Type
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from sqlalchemy.sql.expression import or_
from sqlalchemy.orm.query import Query

from app.models.plant_data import PlantRecord, FormulaVariable
from app.schemas.plant_record import PlantRecordCreate, PlantRecordUpdate
from app.schemas.formula_variable import FormulaVariableCreate, FormulaVariableUpdate
from app.crud.base import CRUDBase

# Plant Record CRUD
class CRUDPlantRecord(CRUDBase[PlantRecord, PlantRecordCreate, PlantRecordUpdate]):
    def create(self, db: Session, *, obj_in: PlantRecordCreate) -> PlantRecord:
        """Create new plant record with calculated values"""
        db_obj = PlantRecord(
            plant_id=obj_in.plant_id,
            date=obj_in.date,
            code=obj_in.code,
            product=obj_in.product,
            truck_no=obj_in.truck_no,
            bill_no=obj_in.bill_no,
            party_name=obj_in.party_name,
            rate=obj_in.rate,
            mv=obj_in.mv,
            oil=obj_in.oil,
            fiber=obj_in.fiber,
            starch=obj_in.starch,
            maize_rate=obj_in.maize_rate,
            notes=obj_in.notes,
        )
        
        # Get formula variables from database and convert to dict
        formula_vars = {}
        for var in db.query(FormulaVariable).all():
            formula_vars[var.name] = var.value
        
        # Calculate derived values using formula variables
        db_obj.calculate_derived_values(formula_vars)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: PlantRecord, obj_in: Union[PlantRecordUpdate, Dict[str, Any]]
    ) -> PlantRecord:
        """Update plant record and recalculate derived values"""
        result = super().update(db, db_obj=db_obj, obj_in=obj_in)
        
        # Get formula variables from database and convert to dict
        formula_vars = {}
        for var in db.query(FormulaVariable).all():
            formula_vars[var.name] = var.value
        
        # Recalculate derived values using formula variables
        result.calculate_derived_values(formula_vars)
        
        db.add(result)
        db.commit()
        db.refresh(result)
        
        return result
    
    def get_filtered(
        self, 
        db: Session, 
        *, 
        plant_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PlantRecord]:
        """Get plant records with filters"""
        query = db.query(PlantRecord)
        
        # Apply filters
        if plant_id:
            query = query.filter(PlantRecord.plant_id == plant_id)
        if start_date:
            query = query.filter(PlantRecord.date >= start_date)
        if end_date:
            query = query.filter(PlantRecord.date <= end_date)
        
        # Order by date and id
        query = query.order_by(PlantRecord.date.desc(), PlantRecord.id.desc())
        
        # Apply pagination
        return query.offset(skip).limit(limit).all()
    
    def get_count(
        self, 
        db: Session, 
        *, 
        plant_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> int:
        """Get count of plant records with filters"""
        query = db.query(func.count(PlantRecord.id))
        
        # Apply filters
        if plant_id:
            query = query.filter(PlantRecord.plant_id == plant_id)
        if start_date:
            query = query.filter(PlantRecord.date >= start_date)
        if end_date:
            query = query.filter(PlantRecord.date <= end_date)
        
        return query.scalar()
    
    def get_statistics(
        self, db: Session, plant_id: Optional[int] = None, 
        start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get statistics for plant records with filters
        """
        query = self._apply_filters(db, plant_id, start_date, end_date)
        
        # Get date range
        min_date_record = query.order_by(self.model.date.asc()).first()
        max_date_record = query.order_by(self.model.date.desc()).first()
        
        min_date = min_date_record.date if min_date_record else None
        max_date = max_date_record.date if max_date_record else None
        
        # Calculate averages for numeric fields
        result = {}
        
        # Calculate count
        result["count"] = query.count()
        
        # Add date range
        result["date_range"] = {
            "start": min_date,
            "end": max_date
        }
        
        # Calculate field averages
        for field in ['rate', 'mv', 'oil', 'fiber', 'starch', 'maize_rate', 
                     'dm', 'rate_on_dm', 'oil_value', 'net_wo_oil_fiber', 
                     'starch_per_point', 'starch_value', 'grain', 'doc']:
            avg = query.with_entities(func.avg(getattr(self.model, field))).scalar()
            result[f"avg_{field}"] = avg
            
        # Calculate min/max for rates
        result["min_rate"] = query.with_entities(func.min(self.model.rate)).scalar()
        result["max_rate"] = query.with_entities(func.max(self.model.rate)).scalar()
        
        return result

    def _apply_filters(
        self, db: Session, plant_id: Optional[int] = None, 
        start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Query:
        """
        Apply common filters to query
        """
        query = db.query(self.model)
        
        if plant_id:
            query = query.filter(self.model.plant_id == plant_id)
        if start_date:
            query = query.filter(self.model.date >= start_date)
        if end_date:
            query = query.filter(self.model.date <= end_date)
            
        return query

# Formula Variable CRUD
class CRUDFormulaVariable(CRUDBase[FormulaVariable, FormulaVariableCreate, FormulaVariableUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[FormulaVariable]:
        """Get formula variable by name"""
        return db.query(FormulaVariable).filter(FormulaVariable.name == name).first()
    
    def reset_all(self, db: Session) -> List[FormulaVariable]:
        """Reset all formula variables to their default values"""
        variables = db.query(FormulaVariable).all()
        for variable in variables:
            variable.reset_to_default()
            db.add(variable)
        db.commit()
        db.refresh(variables)
        return variables
    
    def reset(self, db: Session, *, id: int) -> Optional[FormulaVariable]:
        """Reset a specific formula variable to its default value"""
        variable = self.get(db, id=id)
        if variable:
            variable.reset_to_default()
            db.add(variable)
            db.commit()
            db.refresh(variable)
        return variable

# Create CRUD instances
plant_record = CRUDPlantRecord(PlantRecord)
formula_variable = CRUDFormulaVariable(FormulaVariable) 