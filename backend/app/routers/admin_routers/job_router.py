from fastapi import APIRouter, Depends, HTTPException, Form
from utils.outh_admin import require_admin
from sqlalchemy.orm import Session
from core.db_dependencies import get_db

from crud.jobCRUD import jobcrud
from crud.applicationCRUD import applicationcrud

from schemas.jobSchema import JobCreateSchema

from services.s3.s3_interaction import s3_client


job_rout = APIRouter(prefix='/admin-panel', dependencies=[Depends(require_admin)])


@job_rout.get('/jobs', tags=['admin-job'], summary='get all jobs')
async def get_all_jobs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20):
    try:
        jobs = jobcrud.get_all(db, skip, limit)
        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения вакансий: {str(e)}')

@job_rout.post('/new_job', tags=['admin-job'], summary='create new job')
async def create_job(
    job_data: JobCreateSchema,
    db: Session = Depends(get_db)
):
    try:
        jobcrud.create_job(db, job_data)
        await s3_client.upload_files(job_data.photos)
        return {
            "message": "Вакансия успешно создана"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка добавления вакансии: {str(e)}'
        )
    
@job_rout.get('/jobs/{job_id}', tags=['admin-job'], summary='get job by id')
async def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    try:
        job = jobcrud.get(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        return job
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Ошибка получения вакансии: {str(e)}'
        )

@job_rout.put('/jobs/{job_id}', tags=['admin-job'], summary='update job')
async def update_job(
    job_id: int,
    job_data: JobCreateSchema,
    db: Session = Depends(get_db)
):
    try:
        job = jobcrud.update_job(db, job_id, job_data)
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        
        return job
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка обновления вакансии: {str(e)}'
        )
    
@job_rout.delete('/jobs/{job_id}', tags=['admin-job'], summary='delete job')
async def delete_job(job_id: int, db: Session = Depends(get_db)):
    try:
        applications_count = applicationcrud.counter_application(db, job_id)
        if applications_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Невозможно удалить вакансию, так как с ней связаны заявки"
            )
            
        job = jobcrud.remove_job(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        
        return {"message": "Вакансия успешно удалена"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка удаления вакансии: {str(e)}'
        ) 