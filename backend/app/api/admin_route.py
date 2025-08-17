from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import Response
from models.model import Jobs, Applications, Settings, ProfessionMedia
from schemas.schema import JobSchema, SettingSchema
from sqlalchemy.orm import Session
from core.dependencies import get_db, require_admin
from typing import List


admin_rout = APIRouter(prefix='/admin-panel', dependencies=[Depends(require_admin)])


@admin_rout.post('/new_job', tags=['admin'], summary='create new job with media')
async def create_job(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    salary: float = Form(...),
    Requirements: str = Form(""),
    Conditions_and_benefits: str = Form(""),
    images: List[UploadFile] = File([]),
    videos: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    try:
        job = Jobs(
            title=title,
            description=description,
            location=location,
            salary=salary,
            Requirements=Requirements,
            Conditions_and_benefits=Conditions_and_benefits
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        for image in images:
            if image.content_type.startswith('image/'):
                file_content = await image.read()
                
                media = ProfessionMedia(
                    job_id=job.id,
                    file_name=image.filename,
                    file_type="image",
                    file_data=file_content,
                    mime_type=image.content_type
                )
                db.add(media)
        
        for video in videos:
            if video.content_type.startswith('video/'):
                file_content = await video.read()
                
                media = ProfessionMedia(
                    job_id=job.id,
                    file_name=video.filename,
                    file_type="video",
                    file_data=file_content,
                    mime_type=video.content_type
                )
                db.add(media)
        
        db.commit()
        
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


@admin_rout.get('/media/{media_id}', tags=['admin'], summary='get media file from database')
async def get_media_file(media_id: int, db: Session = Depends(get_db)):
    try:
        media = db.query(ProfessionMedia).filter(ProfessionMedia.id == media_id).first()
        if not media:
            raise HTTPException(status_code=404, detail="Файл не найден")
        
        return Response(
            content=media.file_data,
            media_type=media.mime_type,
            headers={"Content-Disposition": f"inline; filename={media.file_name}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения файла: {str(e)}")


@admin_rout.get('/jobs', tags=['admin'], summary='get all jobs with media info')
async def get_all_jobs(db: Session = Depends(get_db)):
    try:
        jobs = db.query(Jobs).order_by(Jobs.created_at.desc()).all()
        result = []
        
        for job in jobs:
            # Получаем медиа файлы для этой вакансии
            media_files = db.query(ProfessionMedia).filter(ProfessionMedia.job_id == job.id).all()
            
            # Разделяем на изображения и видео
            images = [{"id": media.id, "name": media.file_name} for media in media_files if media.file_type == "image"]
            videos = [{"id": media.id, "name": media.file_name} for media in media_files if media.file_type == "video"]
            
            result.append({
                'id': job.id,
                'title': job.title,
                'description': job.description,
                'location': job.location,
                'salary': job.salary,
                'created_at': job.created_at,
                'requirements': job.Requirements or '',
                'conditions_and_benefits': job.Conditions_and_benefits or '',
                'images': images,
                'videos': videos
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения вакансий: {str(e)}')


@admin_rout.get('/jobs/{job_id}', tags=['admin'], summary='get job by id with media')
async def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    try:
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        
        media_files = db.query(ProfessionMedia).filter(ProfessionMedia.job_id == job.id).all()
        
        images = [{"id": media.id, "name": media.file_name} for media in media_files if media.file_type == "image"]
        videos = [{"id": media.id, "name": media.file_name} for media in media_files if media.file_type == "video"]
        
        return {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary": job.salary,
            "Requirements": job.Requirements,
            "Conditions_and_benefits": job.Conditions_and_benefits,
            "created_at": job.created_at,
            "images": images,
            "videos": videos
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Ошибка получения вакансии: {str(e)}'
        )


@admin_rout.put('/jobs/{job_id}', tags=['admin'], summary='update job')
async def update_job(job_id: int, updated_job: JobSchema, db: Session = Depends(get_db)):
    try:
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        
        job.title = updated_job.title
        job.description = updated_job.description
        job.location = updated_job.location
        job.salary = updated_job.salary
        job.Requirements = updated_job.Requirements
        job.Conditions_and_benefits = updated_job.Conditions_and_benefits
        
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
        job = db.query(Jobs).filter(Jobs.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Вакансия не найдена')
        
        media_files = db.query(ProfessionMedia).filter(ProfessionMedia.job_id == job_id).all()
        for media in media_files:
            db.delete(media)
        
        db.delete(job)
        db.commit()
        
        return {"message": "Вакансия успешно удалена"}
    except HTTPException:
        raise
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
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения заявок: {str(e)}')


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
async def update_settings(payload: SettingSchema, db: Session = Depends(get_db)):
    try:
        settings = db.query(Settings).order_by(Settings.id.asc()).first()
        if not settings:
            settings = Settings(
                site_email=payload.site_email or '',
                site_phone=payload.site_phone or '',
                site_adress=payload.site_adress or '',
            )
            db.add(settings)
        else:
            settings.site_email = payload.site_email
            settings.site_phone = payload.site_phone
            settings.site_adress = payload.site_adress
        db.commit()
        db.refresh(settings)
        return {
            "site_email": settings.site_email,
            "site_phone": settings.site_phone,
            "site_adress": settings.site_adress
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка сохранения настроек: {str(e)}')