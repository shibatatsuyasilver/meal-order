from fastapi import FastAPI, HTTPException, Depends
from typing import Annotated, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine
import models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ['http://localhost:3000', ]

app.add_middleware(CORSMiddleware, 
                   allow_origins= origins,
                   allow_credentials = True,
                   allow_methods=['*'],
                   allow_headers=['*'])

class TransactionBase(BaseModel):
    amount: float
    category: str
    date: str

class TranscationModel(TransactionBase):
    id: int

    class Config:
        orm_mode = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
db_dependency = Annotated[Session, Depends(get_db)]

models.Base.metadata.create_all(bind=engine)

@app.post("/transcations/", response_model=TranscationModel)
async def create_transcation(transcation: TransactionBase, db: db_dependency):
    db_transcation = models.Transcation(**transcation.model_dump())
    db.add(db_transcation)
    db.commit()
    db.refresh(db_transcation)
    return db_transcation

@app.get("/transcations/", response_model=List[TranscationModel])
async def read_transcations(db: db_dependency, skip: int = 0, limit: int = 100):
    transcations = db.query(models.Transcation).offset(skip).limit(limit).all()
    return transcations