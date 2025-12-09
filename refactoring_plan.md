# Project Refactoring & GitHub Preparation Plan

This document outlines the steps to clean up the project, improve security, and prepare it for a professional GitHub portfolio release.

## 1. Security & Cleanup
**Priority: High**

*   **Remove Hardcoded Secrets**: 
    *   Target: `backend/main.py`
    *   Action: Identify the Groq API key (`gsk_...`) and replace it with `os.getenv("GROQ_API_KEY")`.
    *   Action: Verify `docker-compose.yml` for hardcoded credentials (Postgres) and move them to `.env` variables where appropriate.
*   **Remove "Garbage" Files**: 
    *   Target: `backend/meal-order/`
    *   Action: Delete this directory. It appears to be an accidentally committed Python virtual environment (`lib/python3.9/...`).
*   **Data Exclusion**:
    *   Target: `ollama/` (local model weights) and `pg-data/` (database persistence).
    *   Action: Ensure these are fully excluded from git tracking via `.gitignore`.

## 2. Git Configuration
Create a robust `.gitignore` file in the root directory to handle:

*   **Python**: `__pycache__`, `venv/`, `.env`, `*.pyc`, `.pytest_cache`
*   **Node/React**: `node_modules/`, `build/`, `dist/`, `.env.local`
*   **System**: `.DS_Store` (Mac), `Thumbs.db` (Windows)
*   **Project Specific**: 
    *   `pg-data/`
    *   `ollama/`
    *   `backend/data/*.pdf` (unless specific samples are intended for the repo)
    *   `backend/meal-order/` (as a safety net)

## 3. Code Refactoring & Quality
Improve the professionalism of the codebase:

*   **Typo Fixes**: 
    *   `create_transcation` -> `create_transaction`
    *   `ceate_embedding...` -> `create_embedding...`
    *   Scan for other spelling errors in variable names and comments.
*   **Code Cleanliness**: 
    *   Remove large blocks of commented-out "dead code" in `backend/main.py`.
    *   Remove unused imports.
*   **Configuration Management**:
    *   Ensure database connection strings are loaded from environment variables to match Docker config.

## 4. Documentation (README.md)
Create a high-quality `README.md` including:

*   **Header**: Project Name & One-line description.
*   **Features**:
    *   RAG (Retrieval Augmented Generation) implementation.
    *   Meal ordering chatbot.
    *   PDF document processing.
*   **Tech Stack Badges**: FastAPI, React, PostgreSQL (pgvector), Ollama, Docker, LangChain.
*   **Prerequisites**: Docker Desktop, Ollama.
*   **Quick Start Guide**:
    1.  `git clone ...`
    2.  `cp .env.example .env`
    3.  `docker-compose up --build`
*   **Architecture Overview**: Explanation of how the services (Frontend, Backend, DB, LLM) interact.

## 5. File Reorganization
*   **Structure**: 
    *   Verify `backend/requirements.txt` is complete (add `python-dotenv` if missing).
    *   Create `.env.example` templates for both root (if needed) and backend.

## Execution Flow
1.  **Delete** `backend/meal-order/`.
2.  **Create** `.gitignore`.
3.  **Refactor** `backend/main.py` (secrets, typos, cleanup).
4.  **Update** `docker-compose.yml` to use env vars.
5.  **Create** `README.md`.