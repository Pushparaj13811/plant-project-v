from sqlalchemy.orm import Session
from decimal import Decimal
from app.models.plant_data import FormulaVariable

def init_db(db: Session) -> None:
    """Initialize the database with default data"""
    # Create default formula variables if they don't exist
    default_variables = [
        {
            'name': 'dm_factor',
            'display_name': 'DM Factor',
            'description': 'Factor used in DM calculation: DM = DM Factor - MV',
            'value': Decimal('100'),
            'default_value': Decimal('100')
        },
        {
            'name': 'oil_value_factor',
            'display_name': 'Oil Value Factor',
            'description': 'Factor used in Oil Value calculation: Oil Value = Oil Value Factor * Oil',
            'value': Decimal('60'),
            'default_value': Decimal('60')
        },
        {
            'name': 'net_factor',
            'display_name': 'Net Factor',
            'description': 'Factor used in Net calculation: Net = Net Factor - Oil - Fiber',
            'value': Decimal('100'),
            'default_value': Decimal('100')
        },
        {
            'name': 'starch_per_point_divisor',
            'display_name': 'Starch Per Point Divisor',
            'description': 'Divisor used in Starch Per Point calculation: Starch Per Point = Maize Rate / Divisor',
            'value': Decimal('64'),
            'default_value': Decimal('64')
        },
        {
            'name': 'grain_factor',
            'display_name': 'Grain Factor',
            'description': 'Factor used in Grain calculation: Grain = Starch * Grain Factor',
            'value': Decimal('0.70'),
            'default_value': Decimal('0.70')
        },
    ]
    
    for var_data in default_variables:
        # Check if variable exists
        existing_var = db.query(FormulaVariable).filter(FormulaVariable.name == var_data['name']).first()
        if not existing_var:
            # Create new variable
            db_var = FormulaVariable(**var_data)
            db.add(db_var)
    
    db.commit() 