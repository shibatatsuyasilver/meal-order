# Meal Order RAG Bot

A comprehensive meal ordering system powered by RAG (Retrieval Augmented Generation), allowing users to query menu information and place orders via natural language. The system leverages LLMs to understand complex requests and manage transaction states.

## 🚀 Features

*   **Intelligent Chatbot**: Understands natural language queries about the menu and ordering process.
*   **RAG Integration**: Uses PDF documents (menus, health info) to provide accurate context-aware responses.
*   **Order Parsing**: Automatically extracts order details (items, quantity, price) from conversation using LLM function calling.
*   **Vector Search**: Utilizes `pgvector` for efficient semantic search over document embeddings.
*   **Menu Management**: Admin interface to upload and process menu PDFs.
*   **User Authentication**: Secure login and session management.
*   **Modern UI**: Responsive design with sidebar navigation and chat history.
*   **Modern Stack**: Built with FastAPI, React, LangChain, and Ollama.

## 🛠 Tech Stack

*   **Backend**: Python, FastAPI, LangChain
*   **Frontend**: React, JavaScript
*   **Database**: PostgreSQL with `pgvector` extension
*   **AI/LLM**: Ollama (Llama 3), Groq API (for high-speed inference), HuggingFace Embeddings
*   **Infrastructure**: Docker, Docker Compose

## 📋 Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.
*   [Ollama](https://ollama.com/) installed and running locally (if using local models).
*   A Groq API Key (for the order parsing logic).

## 🏃‍♂️ Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/meal-order-rag.git
    cd meal-order-rag
    ```

2.  **Configure Environment**
    Copy the example environment file and add your credentials:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and set `GROQ_API_KEY`, `TAVILY_API_KEY` (required for web search), and `DATABASE_URL`.*

3.  **Start the Application**
    Run the services using Docker Compose:
    ```bash
    docker-compose up --build
    ```

4.  **Access the App**
    *   **Frontend**: Open [http://localhost:3000](http://localhost:3000)
    *   **API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)

## 🍽 MCP Restaurant Agents (ADK Demo)

Run the MCP server (serves restaurant tools) and the ADK multi-agent runner:

1) Start MCP server (needs Postgres seeded with `products` data):
```bash
python backend/mcp/server.py
```
2) Start the multi-agent runner (host/waiter/chef/online order). Override via env or flags if needed:
```bash
# defaults: MCP_SERVER_NAME=restaurant-server, MCP_SERVER_URL=http://127.0.0.1:8080
python -m backend.mcp.agents.restaurant_runner --server-url http://127.0.0.1:8080 --server-name restaurant-server
```
Sample flows: greet a customer, ask for menu items, place an order, or process an online order ID.

## 🏗 Architecture

```mermaid
graph TD
    subgraph Docker Network
        Frontend[React Frontend] -->|HTTP/3000| Backend[FastAPI Backend]
        Backend -->|SQL/5432| DB[(Postgres + pgvector)]
        Backend -->|HTTP/11434| Ollama[Ollama Service]
    end
    
    User -->|Browser| Frontend
    Backend -->|LangChain| ExternalAPI[Groq API]
```

## 📂 Project Structure

*   `/backend` - FastAPI application, RAG logic, and database models.
*   `/react-meal-shopping-cart` - React frontend application.
*   `/pg-data` - Persistence for the Postgres database (excluded from git).
*   `/ollama` - Local model storage (excluded from git).

## ⚙️ Configuration

Key environment variables:

* `DATABASE_URL` (or legacy `DB_CONNECTION`): Postgres/pgvector connection string, e.g. `postgresql+psycopg://user:pass@postgres_db:5432/meal-order`.
* `GROQ_API_KEY`: Required for Groq-hosted LLM calls.
* `TAVILY_API_KEY`: Required for web search fallbacks in the RAG pipeline.
* `OLLAMA_BASE_URL`: URL for your Ollama instance (defaults to `http://ollama:11434`).
* `MCP_SERVER_URL`: MCP server URL for the ADK runner (defaults to `http://127.0.0.1:8080`).
* `MCP_SERVER_NAME`: MCP server name for the ADK runner (defaults to `restaurant-server`).

See `.env.example` for defaults; keep your real `.env` out of version control.

## 🧭 API Notes

* `/upload` now accepts PDF files up to 10MB; unsupported types or oversized files return an HTTP error.
* `/uploadMessage` supports an optional `session_id` in the request body to keep chat histories isolated per user/session.

## 🛡 Security Note

This project uses environment variables for sensitive keys. Never commit your `.env` file to version control. The `.gitignore` is configured to exclude it automatically.
