from fastapi import APIRouter, Depends, HTTPException
from utils.outh_admin import require_admin
from core.db_dependencies import get_db
from sqlalchemy.orm import Session
from utils.send_email import send_email

from starlette.background import BackgroundTask
from starlette.responses import JSONResponse

from crud.applicationCRUD import applicationcrud
from crud.settingsCRUD import settingscrud

from schemas.applicationSchema import GetStatusApplicationSchema


application_rout = APIRouter(prefix='/admin-panel', dependencies=[Depends(require_admin)])


@application_rout.get('/applications', tags=['admin-application'], summary='get all applications')
async def get_all_applications(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20):
    try:
        applications = applicationcrud.get_all(db, skip, limit)

        return applications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения заявок: {str(e)}')
    
@application_rout.put('/applications/{id}/status', tags=['admin-application'], summary='application has been responded')
async def get_status_application(
    id: int,
    app_data: GetStatusApplicationSchema,
    db: Session = Depends(get_db),
    skip: int = 0, 
    limit: int = 1):
    try:
        application = applicationcrud.update_status(db, id, app_data)
        settings = settingscrud.get_all(db, skip, limit)
        settings = settings[0]
        login = settings.site_email
        if not application:
            raise HTTPException(status_code=404, detail='Заявка не найдена!')
        
        solve = False
        if app_data.status == 'approved':
            solve = True
        task = BackgroundTask(send_email, mail=application.email, solve=solve, name=application.fio, login=login)
        return JSONResponse(
            {'message': f'Статус заявки успешно изменен на {app_data.status}'
        }, background=task)
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка: {str(e)}')
    
@application_rout.get('/applications/filter/{status}', tags=['admin-application'], summary='filter applications')
async def filter_applications(
    status: str,
    db: Session = Depends(get_db)):
    try:
        applications = applicationcrud.filter_application(db, status)

        return applications
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка фильтрации: {str(e)}')