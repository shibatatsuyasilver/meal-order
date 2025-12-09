from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from typing import Annotated, List, Dict, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine, DATABASE_URL
from rag import RAGService
from langchain_community.document_loaders import PyPDFLoader
import models
import os
import json
from langchain_community.embeddings import OllamaEmbeddings
from langchain_postgres.vectorstores import PGVector
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.llms import Ollama
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from langchain_experimental.llms.ollama_functions import OllamaFunctions
from langchain_core.runnables import RunnableLambda
from langchain.text_splitter import CharacterTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.retrievers import ParentDocumentRetriever
from langchain_community.embeddings import HuggingFaceEmbeddings
from sql import SQLDocStore
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

# Initialize Models & Embeddings (Stateless resources)
huggingface_embedding = HuggingFaceEmbeddings(model_name="BAAI/bge-m3")
llm = Ollama(model="llama3", base_url=OLLAMA_BASE_URL)

app = FastAPI(title="Meal Order RAG API")

origins = ['http://localhost:3000']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

DATA_DIR = Path(__file__).resolve().parent / "data"
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB limit
ALLOWED_CONTENT_TYPES = {"application/pdf"}

# Text Splitters (Stateless)
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=100)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=30)

# Session Management
class SessionState:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.chat_history: List[tuple[str, str]] = []
        
        # Initialize RAG Service
        self.rag_service = RAGService(
            groq_api_key=GROQ_API_KEY,
            tavily_api_key=os.getenv("TAVILY_API_KEY")
        )
        
        # Initialize Vector Store
        # Using a unique collection name for each session
        self.vectorstore = PGVector(
            embeddings=huggingface_embedding,
            collection_name=f"docs_{session_id}",
            connection=DATABASE_URL,
            use_jsonb=True,
        )
        
        # Initialize User Query Vector Store (for memory)
        self.user_query_vectorstore = PGVector(
            embeddings=huggingface_embedding,
            collection_name=f"user_query_{session_id}",
            connection=DATABASE_URL,
            use_jsonb=True,
        )

        # Initialize Doc Store for ParentDocumentRetriever
        self.docstore = SQLDocStore(
            connection_string=DATABASE_URL, 
            collection_name=f"parent_docs_{session_id}"
        )
        
        # Initialize Retriever
        self.retriever = ParentDocumentRetriever(
            vectorstore=self.vectorstore,
            docstore=self.docstore,
            child_splitter=child_splitter,
            parent_splitter=parent_splitter,
            search_kwargs={"k": 3},
        )

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}
        
    def get_session(self, session_id: str) -> SessionState:
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionState(session_id)
        return self._sessions[session_id]

session_manager = SessionManager()

# Pydantic Models
class TransactionBase(BaseModel):
    amount: float
    category: str
    date: str

class Message(BaseModel):
    message: str
    session_id: Optional[str] = None

class TransactionModel(TransactionBase):
    id: int

    class Config:
        orm_mode = True

# Utility Functions
def load_and_split_documents(filepath: str):
    loader = PyPDFLoader(filepath)
    documents = loader.load()
    text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=100, separator=' ')
    return text_splitter.split_documents(documents)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
models.Base.metadata.create_all(bind=engine)

def create_embedding_insert_db(file_name: str, retriever: ParentDocumentRetriever) -> None:
    docs = load_and_split_documents(file_name)
    for d in docs:
        text = ''.join(d.page_content.split('\n'))
        text = ''.join(text.split(' '))
        d.page_content = text
    retriever.add_documents(docs)


def resolve_session_id(session_id: Optional[str]) -> str:
    return session_id or "default"

# Tools
@tool
def add(a: int, b: int) -> int:
    """Adds a and b."""
    return a + b

@tool
def multiply(a: int, b: int) -> int:
    """Multiplies a and b."""
    return a * b

def grade_query(q: str) -> str:
    prompt = PromptTemplate(
        template="""<|begin_of_text|><|start_header_id|>system<|end_header_id|>你是一個評分者，你需要為使用者的問題進行打分給予'yes'或'no'問題只與訂餐或訂便當有關的給予'yes'無相關的給予'no'
        並且無需給予任何理由直接回傳JSON，裡面只能有score屬性。
        例如：我需要3個椒麻雞飯1個鱈魚排飯，請給yes。
        以下是使用者的問題:
        {question} 
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>""",
        input_variables=["question"],
    )
    answer_grader = prompt | llm | JsonOutputParser()
    score = answer_grader.invoke({'question': q})
    return score['score']

def parse_order(m: str) -> dict:
    if not GROQ_API_KEY:
        print("Warning: GROQ_API_KEY is not set.")
        return {}

    groq_llm = ChatGroq(temperature=0, groq_api_key=GROQ_API_KEY, model_name="llama3-70b-8192")

    prompt = PromptTemplate(
        template="""<|begin_of_text|><|start_header_id|>system<|end_header_id|> 你是一個餐廳經理,你們餐廳提供以下菜單供顧客選擇
                椒麻雞飯 價格100元,
                炸排骨飯 價格120元,
                炸雞腿飯 價格110元,
                鱈魚排飯 價格118元,
                炸紅糟肉飯 價格90元,
                焢肉飯 價格90元,
                玫瑰油雞飯 價格130元,
                鹽酥雞飯  價格80元,
                你需要根據顧客的要求整理出JSON
                例如：我需要3個椒麻雞飯1個鱈魚排飯
                你需要整理出meal裡面包涵price, quantity的JSON
                如果顧客沒有提出任何根便當有關的需求，請回覆empty JSON．
                現在根據上面的規則，提供以下敘述：
                {question} 
                Answer: 提供有著meal裡面包涵price, quantity的JSON
                <|eot_id|><|start_header_id|>assistant<|end_header_id|>
                """,
        input_variables=["question"],
    )

    custom_order_json_parser = prompt | groq_llm | JsonOutputParser()
    result = custom_order_json_parser.invoke({"question": m})
    print(f"Order parsed: {result}")
    return result

def create_text(order: dict) -> List[str]:
    res = []
    if 'meal' in order:
        for item in order['meal']:
            res.append(str(item['price']) + ' * ' + str(item['quantity']))
    return res

# Routes
@app.post("/transactions/", response_model=TransactionModel)
async def create_transaction(transaction: TransactionBase, db: db_dependency):
    db_transaction = models.Transcation(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/transactions/", response_model=List[TransactionModel])
async def read_transactions(db: db_dependency, skip: int = 0, limit: int = 100):
    transactions = db.query(models.Transcation).offset(skip).limit(limit).all()
    return transactions

@app.post("/upload/")
async def upload(
    files: List[UploadFile] = File(...),
    session_id: Optional[str] = Form(None)
):
    session_id = resolve_session_id(session_id)
    session = session_manager.get_session(session_id)
    
    uploaded_files = []
    for file in files:
        sanitized_name = file.filename.replace(" ", "-")
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type for {sanitized_name}. Please upload PDF files.",
            )
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            file_path = DATA_DIR / sanitized_name
            print(f"Saving file to: {file_path}")

            bytes_written = 0
            with file_path.open("wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    bytes_written += len(chunk)
                    if bytes_written > MAX_UPLOAD_SIZE:
                        raise HTTPException(
                            status_code=413,
                            detail=f"{sanitized_name} exceeds the {MAX_UPLOAD_SIZE // (1024 * 1024)}MB limit.",
                        )
                    f.write(chunk)

            create_embedding_insert_db(str(file_path), session.retriever)
            uploaded_files.append(sanitized_name)
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error uploading {sanitized_name}: {e}")
            raise HTTPException(
                status_code=500, detail=f"There was an error uploading {sanitized_name}"
            )
        finally:
            await file.close()

    return {"message": f"Successfully uploaded {uploaded_files}", "session_id": session_id}

@app.post("/uploadMessage/")
async def get_user_message(user_message: Message):
    print(f"Received message: {user_message.message}")
    session_id = resolve_session_id(user_message.session_id)
    session = session_manager.get_session(session_id)
    
    history = session.chat_history
    score = grade_query(user_message.message)
    
    if score == 'yes':
        res = parse_order(user_message.message)
        if res and res != {}:
            model = OllamaFunctions(model="llama3", format="json", base_url=OLLAMA_BASE_URL)
            model = model.bind_tools(
                tools=[
                    {
                        "name": "add",
                        "description": "Adds a and b",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "a": {"type": "int"},
                                "b": {"type": "int"},
                            },
                            "required": ["a", "b"],
                        },
                    },
                    {
                        "name": "multiply",
                        "description": "multiplies a and b",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "a": {"type": "int"},
                                "b": {"type": "int"},
                            },
                            "required": ["a", "b"],
                        },
                    }
                ]
            )
            functions = {"add": add, "multiply": multiply}
            tool_output = 0
            
            for msg in create_text(res):
                messages = [HumanMessage(content=msg)]
                ai_msg = model.invoke(messages)
                messages.append(ai_msg)
                
                if 'function_call' in ai_msg.additional_kwargs:
                    function_call = ai_msg.additional_kwargs['function_call']
                    print(f"Function call: {function_call}")
                    
                    arguments = json.loads(function_call['arguments'])
                    function_name = function_call['name'].lower()
                    
                    if function_name == 'add':
                        selected_tool = RunnableLambda(functions['add'])
                    else:
                        selected_tool = RunnableLambda(functions['multiply'])
                    
                    tool_output += int(selected_tool.invoke(arguments))
                    print(f"Tool output: {tool_output}")
            
            return {"ai_message": '您好總共需要跟您收 ＄' + str(tool_output), "session_id": session_id} 
    
    # Fallback to RAG
    # Using session-specific retriever
    docs = session.retriever.get_relevant_documents(user_message.message)
    temp_history = []
    
    if len(docs) == 0:
        docs = session.vectorstore.similarity_search(user_message.message)
    
    # Using session-specific user_query_vectorstore
    relative_query = session.user_query_vectorstore.similarity_search(user_message.message, k=4)
    
    # Since vectorstore is now session-specific, we don't need to filter by session_id in metadata
    if history and relative_query:
        for candidate in relative_query:
            # Metadata check redundant as collection is scoped, but keeping for safety if reusing objects
            # candidate_session = candidate.metadata.get("session_id")
            # if candidate_session and candidate_session != session_id:
            #     continue
            
            for u, ai in reversed(history):
                if str(candidate.page_content) == u:
                    temp_history.append((u, ai))
                    break
            if temp_history:
                break
                
    # Use session.rag_service
    # rag_service.run expects (message, documents, chat_history)
    ai_response = session.rag_service.run(user_message.message, docs, temp_history)
    
    # Update user query history
    session.user_query_vectorstore.add_documents(
        [Document(page_content=user_message.message, metadata={"session_id": session_id})]
    )
    
    # Update chat history
    session.chat_history.append((user_message.message, ai_response))
    
    return {"ai_message": ai_response, "session_id": session_id}
