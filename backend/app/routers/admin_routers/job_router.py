from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from utils.outh_admin import require_admin
from sqlalchemy.orm import Session
from core.db_dependencies import get_db
from uuid import uuid4
from pathlib import Path
from typing import List
import asyncio

from starlette.responses import JSONResponse

from crud.jobCRUD import jobcrud
from crud.applicationCRUD import applicationcrud

from schemas.jobSchema import JobCreateSchema, JobUpdateSchema

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
        return {
            "message": "Вакансия успешно создана"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка добавления вакансии: {str(e)}'
        )
    
@job_rout.post('/upload-images', tags=['admin-job'], summary='upload images to s3')
async def upload_images(photos: List[UploadFile] = File(...)):
    urls = []
    try:
        for file in photos:
            ext = Path(file.filename).suffix
            key = f"jobs/{uuid4()}{ext}"
            content = await file.read()
            asyncio.create_task(s3_client.upload_content(key, content, file.content_type))
            url = f"{s3_client.config['endpoint_url'].rstrip('/')}/{s3_client.bucket_name}/{key}"
            urls.append(url)
        return JSONResponse({"urls": urls})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки: {e}")

@job_rout.post("/delete-images", tags=["admin-job"], summary='delete images from s3')
async def delete_images(keys: List[str] = Body(...)):
    asyncio.create_task(s3_client.delete_files(keys)) 
    return JSONResponse({"deleted": len(keys)})



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
    job_data: JobUpdateSchema,
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
        photo_keys = jobcrud.get_job_photos_keys(db, job_id)

        if photo_keys:
            await s3_client.delete_files(photo_keys)

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