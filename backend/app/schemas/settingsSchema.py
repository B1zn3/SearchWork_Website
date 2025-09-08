from pydantic import BaseModel, EmailStr, field_validator, Field
import re


class SettingSchema(BaseModel):
    site_email: EmailStr
    site_phone: str
    site_adress: str = Field(..., min_length=8, max_length=100)
     
    @field_validator('site_phone')
    @classmethod
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('Номер телефона не может быть пустым')
        if not re.match(r'^[\+]?[0-9\s\-\(\)]{10,20}$', v.strip()):
            raise ValueError('Некорректный номер телефона')
        return v.strip()