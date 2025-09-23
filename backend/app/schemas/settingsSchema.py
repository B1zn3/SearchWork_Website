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

        clean_phone = re.sub(r'[\s\-\(\)]', '', v.strip())
        
        if not re.match(r'^(\+375|80)(25|29|33|44|17)\d{7}$', clean_phone):
            raise ValueError('Некорректный номер телефона. Используйте белорусский формат: +375 XX XXX-XX-XX')
        
        return v.strip()