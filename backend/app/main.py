from fastapi import FastAPI
import uvicorn 
from fastapi.staticfiles import StaticFiles

from routers.user_routers.user_route import user_rout
from routers.admin_routers.job_router import job_rout
from routers.admin_routers.application_router import application_rout
from routers.admin_routers.setting_router import setting_rout
from routers.load_templates_routers.load_templates_router import template_rout


app = FastAPI()


app.mount("/static", StaticFiles(directory='/app/frontend/src/static'), name="static")
app.mount("/admin/static", StaticFiles(directory='/app/frontend/admin-panel/static'), name="admin-static")


app.include_router(user_rout)
app.include_router(job_rout)
app.include_router(application_rout)
app.include_router(setting_rout)
app.include_router(template_rout)


if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)

