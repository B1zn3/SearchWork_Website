from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db_dependencies import get_db

from crud.jobCRUD import jobcrud
from crud.applicationCRUD import applicationcrud
from crud.settingsCRUD import settingscrud

from schemas.applicationSchema import ApplicationSchema 
from schemas.wetherSchema import WeatherSchema

from services.weather_api.get_info_weather import get_weather


user_rout = APIRouter(prefix='/main')


@user_rout.get('/jobs', tags=['user'], summary='get all jobs')
async def get_all_jobs(
    db: Session = Depends(get_db),
    skip: int = 0, 
    limit: int = 20):
    jobs = jobcrud.get_all(db, skip, limit)

    return jobs

@user_rout.get('/weather-info/{latitude}/{longitude}', tags=['user'], summary='get data of weather')
async def get_all_jobs(latitude: float,
                       longitude: float):
    result = await get_weather(f"{latitude} {longitude}")
    return result

@user_rout.get('/jobs/{job_id}', tags=['user'], summary='get job by id')
async def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = jobcrud.get(db, job_id)
    
    return job

@user_rout.post('/apply/{job_id}', tags=['user'], summary='submit application')
async def submit_application(
    job_id: int,
    application_data: ApplicationSchema,
    db: Session = Depends(get_db)
):
    try:
        application_data.job_id = job_id
        application = applicationcrud.create(db, application_data)

        return application
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Ошибка отправки заявки: {str(e)}'
        )

@user_rout.get('/settings', tags=['user'], summary='get public site settings')
async def get_public_settings(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 1
    ):
    try:
        settings = settingscrud.get_all(db, skip, limit)
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения настроек: {str(e)}')
