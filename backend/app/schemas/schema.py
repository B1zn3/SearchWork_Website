from pydantic import BaseModel, EmailStr, field_validator, ValidationError
import re



class JobSchema(BaseModel):
    title: str
    description: str
    location: str
    salary: float
    Requirements: str
    Conditions_and_benefits: str

class ApplicationSchema(BaseModel):
    fio: str
    email: EmailStr
    phone: str
    experience: str

    @field_validator('fio')
    @classmethod
    def validate_fio(cls, v):
        if not v or not v.strip():
            raise ValueError('ФИО не может быть пустым')
        
        if not re.match(r'^[А-Яа-яЁё\s-]{2,100}$', v.strip()):
            raise ValueError('ФИО должно содержать только русские буквы, пробелы и дефисы (2-100 символов)')
        
        words = v.strip().split()
        if len(words) < 2:
            raise ValueError('ФИО должно содержать минимум имя и фамилию')
        
        return v.strip()
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('Номер телефона не может быть пустым')

        clean_phone = re.sub(r'[\s\-\(\)]', '', v.strip())
        
        if not re.match(r'^(\+375|80)(25|29|33|44|17)\d{7}$', clean_phone):
            raise ValueError('Некорректный номер телефона. Используйте белорусский формат: +375 XX XXX-XX-XX')
        
        return v.strip()
    
    @field_validator('experience')
    @classmethod
    def validate_experience(cls, v):
        if v is None:
            return ''
        
        v = v.strip()
        if len(v) > 2000:
            raise ValueError('Описание опыта работы не должно превышать 2000 символов')
        
        return v

class SettingSchema(BaseModel):
    site_email: str
    site_phone: str
    site_adress: str