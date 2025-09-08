from sqlalchemy.orm import Session

class BaseCRUD():
    def __init__(self, model):
        self.model = model

    def get(self, db: Session, id: int):
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, db: Session, skip: int, limit: int):
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_data):
        job_data = self.model(**obj_data.dict())

        db.add(job_data)
        db.commit()
        db.refresh(job_data)
    
        return job_data

    def update(self, db: Session, id: int, obj_data):
        db_obj = self.get(db, id)
        update_data = obj_data.dict()

        if db_obj:
            for key, value in update_data.items():
                setattr(db_obj, key, value)

            db.commit()
            db.refresh(db_obj)

        return db_obj
    
    def delete(self, db: Session, id: int):
        db_obj = self.get(db, id)

        if db_obj:
            db.delete(db_obj)
            db.commit()

        return db_obj