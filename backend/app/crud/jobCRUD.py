from crud.baseCrud import BaseCRUD
from sqlalchemy.orm import Session
from models.model import Jobs, JobPhoto
from schemas.jobSchema import JobCreateSchema, JobUpdateSchema

class JobCRUD(BaseCRUD):
    def __init__(self):
        super().__init__(Jobs)
    
    def create_job(self, db: Session, job_data: JobCreateSchema):
        photo_urls = job_data.photos if hasattr(job_data, "photos") else []
        photo_objs = [JobPhoto(url=str(url)) for url in photo_urls]

        job_fields = job_data.model_dump(exclude={'photos'})
        job = Jobs(**job_fields)
        job.photos = photo_objs

        db.add(job)
        db.commit()
        db.refresh(job)

        return job

    def update_job(self, db: Session, id: int, job_data: JobUpdateSchema):
        return super().update(db, id, job_data)
    
    def remove_job(self, db: Session, id: int):
        return super().delete(db, id)
    
    def get_job_photos_keys(self, db: Session, job_id: int):
        photos = db.query(JobPhoto).filter(JobPhoto.job_id == job_id).all()
        keys = []
        for photo in photos:
            key = 'jobs/'+photo.url.split('/')[-1]
            keys.append(key)
        return keys
    

jobcrud = JobCRUD()
    