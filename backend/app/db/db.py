from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os


load_dotenv(encoding='UTF-8')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://webuser:webpass@db:5432/websearch')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)