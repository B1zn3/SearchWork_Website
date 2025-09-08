from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db_dependencies import get_db
from utils.outh_admin import require_admin

from crud.settingsCRUD import settingscrud

from schemas.settingsSchema import SettingSchema


setting_rout = APIRouter(prefix='/admin-panel', dependencies=[Depends(require_admin)])


@setting_rout.get('/settings', tags=['admin-setting'], summary='get site settings')
async def get_settings(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 1):
    try:
        settings = settingscrud.get_all(db, skip, limit)
        
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Ошибка получения настроек: {str(e)}')


@setting_rout.put('/settings', tags=['admin-setting'], summary='update site settings')
async def update_settings(
    setting_data: SettingSchema = Depends(),
    db: Session = Depends(get_db),
    skip: int =  0,
    limit: int = 10
):
    try:
        all_settings = settingscrud.get_all(db, skip, limit)
        
        if not all_settings:
            settingscrud.create(db, setting_data)
            return {
                "message": "Настройки созданы",
            }
        else:
            setting_id = all_settings[0].id
            updated_settings = settingscrud.update_settings(db, setting_id, setting_data)
            return {
                "message": "Настройки обновлены",
                "data": updated_settings
            }
            
    except Exception as e: 
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Ошибка сохранения настроек: {str(e)}')