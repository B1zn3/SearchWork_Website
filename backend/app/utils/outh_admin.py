import os, secrets
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasicCredentials, HTTPBasic

security = HTTPBasic()


def require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    admin_username = os.getenv('ADMIN_USERNAME')
    admin_password = os.getenv('ADMIN_PASSWORD')     
    if not (secrets.compare_digest(credentials.password, admin_password) and secrets.compare_digest(credentials.username, admin_username)):
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Basic"})
    return True