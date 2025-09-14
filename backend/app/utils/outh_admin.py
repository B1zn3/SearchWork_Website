import os, secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasicCredentials, HTTPBasic
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated=['auto'])
security = HTTPBasic()

hashed_admin_password = os.getenv("ADMIN_PASSWORD_HASH")  
admin_username = os.getenv("ADMIN_USERNAME")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != admin_username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Unaythorized', 
            headers={'WWW-Authenticate': 'Basic'}
        )
    if not verify_password(credentials.password, hashed_admin_password):
        raise HTTPException(status_code=401, detail="Unauthorized", headers={"WWW-Authenticate": "Basic"})
    return True