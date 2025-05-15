from typing import Optional

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.plant import Plant
from app.schemas.plant import PlantCreate, PlantUpdate


class CRUDPlant(CRUDBase[Plant, PlantCreate, PlantUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Plant]:
        return db.query(Plant).filter(Plant.name == name).first()


plant = CRUDPlant(Plant) 