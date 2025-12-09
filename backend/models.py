from database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean
from pgvector.sqlalchemy import Vector

N_DIM = 1024

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
class Message(Base):
    __tablename__ = 'user_message'
    id = Column(Integer, primary_key=True, autoincrement=True)
    is_user = Column(Boolean)
    content = Column(String)