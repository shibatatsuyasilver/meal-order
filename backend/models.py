from database import Base
from sqlalchemy import Column, Integer, String, Float
from pgvector.sqlalchemy import Vector

N_DIM = 4096

class Transcation(Base):
    __tablename__ = 'transcations'
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    category = Column(String)
    date = Column(String)

class TextEmbedding(Base):
    __tablename__ = 'text_embeddings'
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String)
    embedding = Column(Vector(N_DIM))
