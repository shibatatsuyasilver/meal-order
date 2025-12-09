import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

logging.basicConfig()
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

load_dotenv()

# Prefer DATABASE_URL, fall back to legacy DB_CONNECTION for backward compatibility
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DB_CONNECTION")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL or DB_CONNECTION environment variable must be set")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
