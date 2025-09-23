from crud.baseCrud import BaseCRUD
from schemas.applicationSchema import ApplicationSchema
from models.model import Applications, Jobs
from sqlalchemy.orm import Session, joinedload


class ApplicationCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(Applications)

    def get_all(self, db: Session, skip: int, limit: int):
        return db.query(self.model).options(joinedload(self.model.job)).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_data: ApplicationSchema):
        return super().create(db, obj_data)
    
    def update_status(self, db: Session, id, obj_data):
        return self.update(db, id, obj_data)
    
    def filter_application(self, db: Session, obj_data):
        return db.query(self.model).filter(self.model.status == obj_data).all()
    
    def counter_application(self, db: Session, id):
        return db.query(self.model).filter(self.model.job_id == id).count()

applicationcrud = ApplicationCRUD()