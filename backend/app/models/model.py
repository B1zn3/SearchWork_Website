from sqlalchemy import Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from datetime import datetime
from typing import Optional, List


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
    Requirements: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    Conditions_and_benefits: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    photos: Mapped[List["JobPhoto"]] = relationship("JobPhoto", back_populates="job", cascade="all, delete-orphan", lazy="selectin")
    applications: Mapped[List["Applications"]] = relationship('Applications', back_populates='job', lazy="select")

class JobPhoto(Base):
    __tablename__ = "job_photos"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id"), nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    job: Mapped["Jobs"] = relationship("Jobs", back_populates="photos")

class Applications(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id"), nullable=False)
    fio: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    experience: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)
    status: Mapped[str] = mapped_column(String, nullable=False, default='pending')
    job: Mapped["Jobs"] = relationship("Jobs", back_populates="applications")

class Settings(Base):
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    site_email: Mapped[str] = mapped_column(String, nullable=False, default='info@jobfinder.ru')
    site_phone: Mapped[str] = mapped_column(String, nullable=False, default='+7 (999) 123-45-67')
    site_adress: Mapped[str] = mapped_column(String, nullable=False, default='г. Москва, ул. Примерная, д. 123')
