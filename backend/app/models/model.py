from sqlalchemy import Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from datetime import datetime


class Base(DeclarativeBase):
    pass

class Jobs(Base):
    __tablename__ = "jobs"
    id = mapped_column(Integer, primary_key=True, index=True)
    title = mapped_column(String, nullable=False)
    description = mapped_column(String, nullable=False)
    location = mapped_column(String, nullable=False)
    salary = mapped_column(Float, nullable=False)
    created_at = mapped_column(DateTime, nullable=False, default=datetime.now)
    Requirements = mapped_column(String, nullable=True)
    Conditions_and_benefits = mapped_column(String, nullable=True)
    photos = relationship("JobPhoto", back_populates="job", cascade="all, delete", lazy="select")
    videos = relationship("JobVideo", back_populates="job", cascade="all, delete", lazy="select")
    applications = relationship('Applications', backref='job', lazy="select")


class JobPhoto(Base):
    __tablename__ = "job_photos"
    id = mapped_column(Integer, primary_key=True, index=True)
    job_id = mapped_column(Integer, ForeignKey("jobs.id"), nullable=False)
    url = mapped_column(String, nullable=False)
    job = relationship("Jobs", back_populates="photos")


class JobVideo(Base):
    __tablename__ = "job_videos"
    id = mapped_column(Integer, primary_key=True, index=True)
    job_id = mapped_column(Integer, ForeignKey("jobs.id"), nullable=False)
    url = mapped_column(String, nullable=False)
    job = relationship("Jobs", back_populates="videos")


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

class Settings(Base):
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    site_email: Mapped[str] = mapped_column(String, nullable=False, default='info@jobfinder.ru')
    site_phone: Mapped[str] = mapped_column(String, nullable=False, default='+7 (999) 123-45-67')
    site_adress: Mapped[str] = mapped_column(String, nullable=False, default='г. Москва, ул. Примерная, д. 123')
