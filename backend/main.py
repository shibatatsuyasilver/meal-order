from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from typing import Annotated, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine
from pypdf import PdfReader
import models
import os
from langchain_community.embeddings import OllamaEmbeddings
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pgvector.sqlalchemy import Vector
import numpy as np
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

def read_pdf(file_path):
    pdf_reader = PdfReader(file_path)
    text = ""

    for page in pdf_reader.pages:
        extracted_text = page.extract_text()
        if extracted_text:  # Check if text is extracted successfully
            ctext = ''.join(extracted_text.split('\n'))
            ctext = ''.join(ctext.split(' '))
            text += ctext + "\n"  # Append text of each page

    return text

def split_text(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    flag = 0
    while start < len(text) and not flag:
        end = start + chunk_size
        if end > len(text):
            end = len(text)
            flag = 1
        chunks.append(text[start:end])
        start = end - overlap  # Overlap chunks

    return chunks

def generate_embeddings(text_chunks):
    embeddings = []
    embedding = OllamaEmbeddings(model="llama3")
    for chunk in text_chunks:
        print(chunk)
        response = embedding.embed_query(chunk)
        embeddings.append(response)
    return embeddings

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
db_dependency = Annotated[Session, Depends(get_db)]
models.Base.metadata.create_all(bind=engine)
session = SessionLocal()
def insert_embeddings(chunks, embedding):
    for chunk, embed in zip(chunks, embedding):
        new_embedding = models.TextEmbedding(content=chunk, embedding=embed)
        session.add(new_embedding)
    session.commit()
file_name = './data/ncd_watch_may_2023_chin.pdf'
pdf_content= read_pdf(file_name)
text_chunks = split_text(pdf_content)
embeddings = generate_embeddings(text_chunks)
insert_embeddings(text_chunks, embeddings)
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

@app.post("/upload/")
async def upload(files: List[UploadFile] = File(...)):
    for file in files:
        try:
            contents = file.file.read()
            file_name = os.getcwd()+"/data/"+file.filename.replace(" ", "-")
            with open(file_name, 'wb') as f:
                f.write(contents)
            pdf_content= read_pdf(file_name)
            text_chunks = split_text(pdf_content)
            embeddings = generate_embeddings(text_chunks)
            insert_embeddings(text_chunks, embeddings)
        except Exception:
            return {"message": "There was an error uploading the file(s)"}
        finally:
            file.file.close()

    return {"message": f"Successfuly uploaded {[file.filename for file in files]}"}    
