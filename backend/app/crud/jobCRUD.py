from crud.baseCrud import BaseCRUD
from sqlalchemy.orm import Session
from models.model import Jobs
from schemas.jobSchema import JobCreateSchema, JobUpdateSchema

class JobCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(Jobs)
    
    def create_job(self, db: Session, job_data: JobCreateSchema):
        return super().create(db, job_data)
    
    def update_job(self, db: Session, id: int, job_data: JobUpdateSchema):
        return super().update(db, id, job_data)
    
    def remove_job(self, db: Session, id: int):
        return super().delete(db, id)
    

jobcrud = JobCRUD()
    