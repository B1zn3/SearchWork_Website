from fastapi import APIRouter, Depends, HTTPException, Form
from models.model import Jobs, Applications, Settings
from schemas.schema import JobSchema, SettingSchema, ValidationError
from sqlalchemy.orm import Session
from core.dependencies import get_db
from utils.send_email import send_email
from utils.outh_admin import require_admin
import asyncio


admin_rout = APIRouter(prefix='/admin-panel', dependencies=[Depends(require_admin)])


@admin_rout.post('/new_job', tags=['admin'], summary='create new job')
async def create_job(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    salary: float = Form(...),
    Requirements: str = Form(""),
    Conditions_and_benefits: str = Form(""),
    db: Session = Depends(get_db)
):
    try:

        try:
            job_data = JobSchema(
                title=title,
                description=description,
                location=location,
                salary=salary,
                Requirements=Requirements,
                Conditions_and_benefits=Conditions_and_benefits,
            )
        except ValidationError as e:
            error_message = str(e.errors()[0]['msg'])
            raise HTTPException(status_code=400, detail=error_message)
        
        job = Jobs(
            title=job_data.title,
            description=job_data.description,
            location=job_data.location,
            salary=job_data.salary,
            Requirements=job_data.Requirements,
            Conditions_and_benefits=job_data.Conditions_and_benefits
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        return {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary": job.salary,
            "Requirements": job.Requirements,
            "Conditions_and_benefits": job.Conditions_and_benefits,
            "created_at": job.created_at,
            "message": "Вакансия успешно создана"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка добавления вакансии: {str(e)}'
        )

@admin_rout.get('/jobs', tags=['admin'], summary='get all jobs')
async def get_all_jobs(db: Session = Depends(get_db)):
    try:
        jobs = db.query(Jobs).order_by(Jobs.created_at.desc()).all()
            
        return({
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary": job.salary,
            "Requirements": job.Requirements,
            "Conditions_and_benefits": job.Conditions_and_benefits,
            "created_at": job.created_at
        }
        for job in jobs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения вакансий: {str(e)}')


@admin_rout.get('/jobs/{job_id}', tags=['admin'], summary='get job by id')
async def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    try:
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        return {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary": job.salary,
            "Requirements": job.Requirements,
            "Conditions_and_benefits": job.Conditions_and_benefits,
            "created_at": job.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Ошибка получения вакансии: {str(e)}'
        )

@admin_rout.put('/jobs/{job_id}', tags=['admin'], summary='update job')
async def update_job(
    job_id: int,
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    salary: str = Form(...),
    Requirements: str = Form(...),
    Conditions_and_benefits: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        
        try:
            job_data = JobSchema(
                title=title,
                description=description,
                location=location,
                salary=salary,
                Requirements=Requirements,
                Conditions_and_benefits=Conditions_and_benefits,
            )
        except ValidationError as e:
            error_message = str(e.errors()[0]['msg'])
            raise HTTPException(status_code=400, detail=error_message)
        
        job.title = job_data.title
        job.description = job_data.description
        job.location = job_data.location
        job.salary = job_data.salary
        job.Requirements = job_data.Requirements
        job.Conditions_and_benefits = job_data.Conditions_and_benefits
        
        db.commit()
        db.refresh(job)
        
        return {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary": job.salary,
            "Requirements": job.Requirements,
            "Conditions_and_benefits": job.Conditions_and_benefits,
            "created_at": job.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка обновления вакансии: {str(e)}'
        )
    
@admin_rout.delete('/jobs/{job_id}', tags=['admin'], summary='delete job')
async def delete_job(job_id: int, db: Session = Depends(get_db)):
    try:
        applications_count = db.query(Applications).filter(Applications.job_id == job_id).count()
        if applications_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Невозможно удалить вакансию, так как с ней связаны заявки"
            )
            
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')

        db.delete(job)
        db.commit()
        
        return {"message": "Вакансия успешно удалена"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'Ошибка удаления вакансии: {str(e)}'
        )



@admin_rout.get('/applications', tags=['admin'], summary='get all applications')
async def get_all_applications(db: Session = Depends(get_db)):
    try:
        rows = (
            db.query(Applications, Jobs.title.label('job_title'))
            .join(Jobs, Jobs.id == Applications.job_id)
            .order_by(Applications.created_at.desc())
            .all()
        )
        return [
            {
                'id': r.Applications.id,
                'job_id': r.Applications.job_id,
                'job_title': r.job_title,
                'fio': r.Applications.fio,
                'email': r.Applications.email,
                'phone': r.Applications.phone,
                'experience': r.Applications.experience or '',
                'created_at': r.Applications.created_at,
                'status': r.Applications.status,
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения заявок: {str(e)}')
    
@admin_rout.put('/applications/{id}/status', tags=['admin'], summary='application has been responded')
async def get_status_application(
    id: int,
    status: str = Form(...),
    db: Session = Depends(get_db)):
    try:
        application = db.query(Applications).filter(Applications.id == id).first()

        job = db.query(Jobs).filter(Jobs.id == application.job_id).first()

        if not application:
            raise HTTPException(status_code=404, detail='Заявка не найдена!')

        application.status = status

        
        solve = False
        if status == 'approved':
            solve = True
        asyncio.create_task(send_email(mail=application.email, solve=solve, title=job.title, name=application.fio))
        
        db.commit()
        db.refresh(application)

        return {
            'message': f'Статус заявки успешно изменен на {status}',
            'status': application.status,
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка: {str(e)}')

@admin_rout.get('/applications/filter/{status}', tags=['admin'], summary='filter applications')
async def filter_applications(
    status: str,
    db: Session = Depends(get_db)):
    try:
        applications = db.query(Applications).filter(Applications.status == status).all()

        return [
            {
                'id': r.id,
                'job_id': r.job_id,
                'fio': r.fio,
                'email': r.email,
                'phone': r.phone,
                'experience': r.experience or '',
                'created_at': r.created_at,
                'status': r.status,
            }
            for r in applications
        ]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка фильтрации: {str(e)}')


@admin_rout.get('/settings', tags=['admin'], summary='get site settings')
async def get_settings(db: Session = Depends(get_db)):
    try:
        settings = db.query(Settings).order_by(Settings.id.asc()).first()
        if not settings:
            settings = Settings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return {
            "site_email": settings.site_email,
            "site_phone": settings.site_phone,
            "site_adress": settings.site_adress,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения настроек: {str(e)}')


@admin_rout.put('/settings', tags=['admin'], summary='update site settings')
async def update_settings(
    site_adress: str = Form(...),
    site_email: str = Form(...),
    site_phone: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        settings = db.query(Settings).order_by(Settings.id.asc()).first()
        if not settings:
            settings = Settings()
            db.add(settings)

        try:
            setting_update = SettingSchema(
                site_adress=site_adress,
                site_email=site_email,
                site_phone=site_phone,
            )   
        except ValidationError as e:
            error_message = str(e.errors()[0]['msg'])
            raise HTTPException(status_code=400, detail=error_message)
        
        settings.site_email=setting_update.site_email
        settings.site_phone=setting_update.site_phone
        settings.site_adress=setting_update.site_adress

        db.commit()
        db.refresh(settings)

        return {
            "site_email": settings.site_email,
            "site_phone": settings.site_phone,
            "site_adress": settings.site_adress,
        }
    except Exception as e: 
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка сохранения настроек: {str(e)}')