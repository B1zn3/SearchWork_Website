import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn 
from api.user_route import user_rout
from api.admin_route import admin_rout
from utils.outh_admin import require_admin


app = FastAPI()

static_dir = "frontend/src/static"
admin_static_dir = "frontend/admin-panel/static"
templates_dir = "frontend/src/templates"
admin_templates_dir = "frontend/admin-panel/templates"

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

if os.path.exists(admin_static_dir):
    app.mount("/admin/static", StaticFiles(directory=admin_static_dir), name="admin_static")

app.include_router(user_rout)
app.include_router(admin_rout)

@app.get("/")
async def read_index():
    index_path = os.path.join(templates_dir, "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Главная страница не найдена")
    return FileResponse(index_path)

@app.get("/admin", dependencies=[Depends(require_admin)])
async def read_admin_panel():
    admin_path = os.path.join(admin_templates_dir, "admin.html")
    if not os.path.exists(admin_path):
        raise HTTPException(status_code=404, detail="Админ панель не найдена")
    return FileResponse(admin_path)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)

