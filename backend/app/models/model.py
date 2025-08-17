from sqlalchemy import Integer, String, DateTime, ForeignKey, Float, Text, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from datetime import datetime


class Base(DeclarativeBase):
    pass

class Jobs(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    salary: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)
    media = relationship("ProfessionMedia", backref="job")
    Requirements: Mapped[str] = mapped_column(String, nullable=True)
    Conditions_and_benefits: Mapped[str] = mapped_column(String, nullable=True)

class Applications(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id"), nullable=False)
    fio: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    experience: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)

class Settings(Base):
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    site_email: Mapped[str] = mapped_column(String, nullable=False, default='info@jobfinder.ru')
    site_phone: Mapped[str] = mapped_column(String, nullable=False, default='+7 (999) 123-45-67')
    site_adress: Mapped[str] = mapped_column(String, nullable=False, default='г. Москва, ул. Примерная, д. 123')

class ProfessionMedia(Base):
    __tablename__ = "profession_media"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id"))
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False)
    file_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)