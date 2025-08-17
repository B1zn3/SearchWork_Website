from fastapi import APIRouter, Depends, HTTPException, Form
from models.model import Jobs, Applications, Settings, ProfessionMedia
from schemas.schema import ApplicationSchema, ValidationError
from sqlalchemy.orm import Session
from core.dependencies import get_db

user_rout = APIRouter(prefix='/main')

@user_rout.get('/jobs', tags=['user'], summary='get all jobs')
async def get_all_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Jobs).all()
    result = []
    
    for job in jobs:
        media = db.query(ProfessionMedia).filter(ProfessionMedia.job_id == job.id).all()
        
        job_data = {
            'id': job.id,
            'title': job.title,
            'description': job.description,
            'location': job.location,
            'salary': job.salary,
            'created_at': job.created_at,
            'requirements': job.Requirements or '',
            'conditions_and_benefits': job.Conditions_and_benefits or '',
            'media': [
                {
                    'id': m.id,
                    'file_name': m.file_name,
                    'file_type': m.file_type,
                    'mime_type': m.mime_type
                }
                for m in media
            ]
        }
        result.append(job_data)
    
    return result

@user_rout.get('/jobs/{job_id}', tags=['user'], summary='get job by id')
async def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Jobs).filter(Jobs.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Вакансия не найдена')
    
    media = db.query(ProfessionMedia).filter(ProfessionMedia.job_id == job_id).all()
    
    return {
        'id': job.id,
        'title': job.title,
        'description': job.description,
        'location': job.location,
        'salary': job.salary,
        'created_at': job.created_at,
        'requirements': job.Requirements or '',
        'conditions_and_benefits': job.Conditions_and_benefits or '',
        'media': [
            {
                'id': m.id,
                'file_name': m.file_name,
                'file_type': m.file_type,
                'mime_type': m.mime_type
            }
            for m in media
        ]
    }

@user_rout.post('/apply/{job_id}', tags=['user'], summary='submit application')
async def submit_application(
    job_id: int,
    fullName: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    experience: str = Form(None),
    db: Session = Depends(get_db)
):
    try:
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')

        try:
            application_data = ApplicationSchema(
                fio=fullName,
                email=email,
                phone=phone,
                experience=experience or ''
            )
        except ValidationError as e:
            error_message = str(e.errors()[0]['msg'])
            raise HTTPException(status_code=400, detail=error_message)

        application = Applications(
            job_id=job_id,
            fio=application_data.fio,
            email=application_data.email,
            phone=application_data.phone,
            experience=application_data.experience
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        return {
            "message": "Заявка успешно отправлена",
            "application_id": application.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Ошибка отправки заявки: {str(e)}'
        )

@user_rout.get('/settings', tags=['user'], summary='get public site settings')
async def get_public_settings(db: Session = Depends(get_db)):
    try:
        settings = db.query(Settings).order_by(Settings.id.asc()).first()
        if not settings:
            return {"site_email": "", "site_phone": "", "site_adress": ""}
        return {
            "site_email": settings.site_email,
            "site_phone": settings.site_phone,
            "site_adress": getattr(settings, 'site_adress', '') or ''
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения настроек: {str(e)}')
    