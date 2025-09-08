from fastapi import APIRouter, Depends, HTTPException
from utils.outh_admin import require_admin
from fastapi.responses import FileResponse
import os


template_rout = APIRouter()


templates_dir = '/app/frontend/src/templates'
admin_templates_dir = '/app/frontend/admin-panel/templates'


@template_rout.get("/", tags=['template'], summary='load main template')
async def read_index():
    index_path = os.path.join(templates_dir, "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Главная страница не найдена")
    return FileResponse(index_path)

@template_rout.get("/admin", tags=['template'], summary='load admin-panel tamplate', dependencies=[Depends(require_admin)])
async def read_admin_panel():
    admin_path = os.path.join(admin_templates_dir, "admin.html")
    if not os.path.exists(admin_path):
        raise HTTPException(status_code=404, detail="Админ панель не найдена")
    return FileResponse(admin_path)