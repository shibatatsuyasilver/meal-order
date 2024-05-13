from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
URL_DATABASE = "postgresql://silver:postgres@localhost:5432/meal-order"

engine = create_engine(URL_DATABASE)

SessionLocal = sessionmaker(autocommit= False, autoflush=False, bind=engine)

Base = declarative_base()