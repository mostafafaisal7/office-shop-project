from databases import Database
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import create_engine
from app.core.config import DATABASE_URL
from typing import Generator

# Async database for FastAPI
database = Database(DATABASE_URL)

# Sync engine for migrations or non-async ops
engine = create_engine(DATABASE_URL.replace("aiomysql", "pymysql"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()