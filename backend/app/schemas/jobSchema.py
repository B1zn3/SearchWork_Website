from pydantic import BaseModel, Field
from typing import Optional, List


class JobSchema(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str
    location: str
    salary: float = Field(..., ge=0)
    Requirements: Optional[str] = None
    Conditions_and_benefits: Optional[str] = None

class JobCreateSchema(JobSchema):
    photos: List[str]

class JobUpdateSchema(JobSchema):
    pass