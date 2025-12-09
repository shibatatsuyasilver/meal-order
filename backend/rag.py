import os
from pprint import pprint
from typing import List, Optional

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

load_dotenv()

class GraphState(TypedDict):
    question: str
    generation: Optional[str]
    web_search: str
    documents: List[Document]

class RAGService:
    def __init__(self, groq_api_key: str, tavily_api_key: Optional[str] = None, model_name: str = "llama3-70b-8192"):
        if not groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is required for RAG operations. "
                "Set it in your environment or .env file."
            )
        
        self.llm = ChatGroq(
            temperature=0,
            groq_api_key=groq_api_key,
            model_name=model_name,
        )
        self.web_search_tool = TavilySearchResults(k=3) if tavily_api_key else None
        
        # Initialize prompts and chains
        self._init_chains()
        
        # Initialize workflow
        self.app = self._build_workflow()

    def _init_chains(self):
        # Retrieval Grader
        self.retrieval_prompt = PromptTemplate(
            template="""<|begin_of_text|><|start_header_id|>system<|end_header_id|> You are a grader assessing relevance 
            of a retrieved document to a user question. If the document contains keywords related to the user question, 
            grade it as relevant. It does not need to be a stringent test. The goal is to filter out erroneous retrievals. \n
            Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question. \n
            Provide the binary score as a JSON with a single key 'score' and no premable or explanation.
            <|eot_id|><|start_header_id|>user<|end_header_id|>
            Here is the retrieved document: \n\n {document} \n\n
            Here is the user question: {question} \n <|eot_id|><|start_header_id|>assistant<|end_header_id|>
            """,
            input_variables=["question", "document"],
        )
        self.retrieval_grader = self.retrieval_prompt | self.llm | JsonOutputParser()

        # Generation Chain
        self.generation_prompt = PromptTemplate(
            template="""<|begin_of_text|><|start_header_id|>system<|end_header_id|> You are an assistant for question-answering tasks. 
            Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. 
            Use three sentences maximum and keep the answer concise and only use in traditional chinese to resopne. <|eot_id|><|start_header_id|>user<|end_header_id|>
            Question: {question} 
            Context: {context} 
            Answer: <|eot_id|><|start_header_id|>assistant<|end_header_id|>""",
            input_variables=["question", "context"],
        )
        self.rag_chain = self.generation_prompt | self.llm | StrOutputParser()

        # Hallucination Grader
        self.hallucination_prompt = PromptTemplate(
            template=""" <|begin_of_text|><|start_header_id|>system<|end_header_id|> You are a grader assessing whether 
            an answer is grounded in / supported by a set of facts. Give a binary 'yes' or 'no' score to indicate 
            whether the answer is grounded in / supported by a set of facts. Provide the binary score as a JSON with a 
            single key 'score' and no preamble or explanation. <|eot_id|><|start_header_id|>user<|end_header_id|>
            Here are the facts:
            \n ------- \n
            {documents} 
            \n ------- \n
            Here is the answer: {generation}  <|eot_id|><|start_header_id|>assistant<|end_header_id|>""",
            input_variables=["generation", "documents"],
        )
        self.hallucination_grader = self.hallucination_prompt | self.llm | JsonOutputParser()

        # Answer Grader
        self.answer_prompt = PromptTemplate(
            template="""<|begin_of_text|><|start_header_id|>system<|end_header_id|> You are a grader assessing whether an 
            answer is useful to resolve a question. Give a binary score 'yes' or 'no' to indicate whether the answer is 
            useful to resolve a question. Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.
            <|eot_id|><|start_header_id|>user<|end_header_id|> Here is the answer:
            \n ------- \n
            {generation} 
            \n ------- \n
            Here is the question: {question} <|eot_id|><|start_header_id|>assistant<|end_header_id|>""",
            input_variables=["generation", "question"],
        )
        self.answer_grader = self.answer_prompt | self.llm | JsonOutputParser()

        # Question Router
        self.router_prompt = PromptTemplate(
            template="""<|begin_of_text|><|start_header_id|>system<|end_header_id|> You are an expert at routing a 
            user question to a vectorstore or web search. Use the vectorstore for questions on 建康主題. 
            You do not need to be stringent with the keywords 
            in the question related to these topics. Otherwise, use web-search. Give a binary choice 'web_search' 
            or 'vectorstore' based on the question. Return the a JSON with a single key 'datasource' and 
            no premable or explanation. Question to route: {question} <|eot_id|><|start_header_id|>assistant<|end_header_id|>""",
            input_variables=["question"],
        )
        self.question_router = self.router_prompt | self.llm | JsonOutputParser()

    def _documents_to_text(self, documents: List[Document]) -> str:
        return "\n\n".join([d.page_content for d in documents]) if documents else ""

    def retrieve(self, state: GraphState) -> GraphState:
        print("---RETRIEVE---")
        question = state["question"]
        documents = state.get("documents", [])
        return {"documents": documents, "question": question}

    def generate(self, state: GraphState) -> GraphState:
        print("---GENERATE---")
        question = state["question"]
        documents = state.get("documents", [])
        context = self._documents_to_text(documents)
        generation = self.rag_chain.invoke({"context": context, "question": question})
        print(generation)
        return {"documents": documents, "question": question, "generation": generation}

    def grade_documents(self, state: GraphState) -> GraphState:
        print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
        question = state["question"]
        documents = state.get("documents", [])
        if not documents:
            return {"documents": [], "question": question, "web_search": "Yes"}

        filtered_docs = []
        web_search = "No"
        for d in documents:
            score = self.retrieval_grader.invoke(
                {"question": question, "document": d.page_content}
            )
            grade = score["score"]
            if grade.lower() == "yes":
                print("---GRADE: DOCUMENT RELEVANT---")
                filtered_docs.append(d)
            else:
                print("---GRADE: DOCUMENT NOT RELEVANT---")
                web_search = "Yes"
        return {"documents": filtered_docs, "question": question, "web_search": web_search}

    def web_search(self, state: GraphState) -> GraphState:
        print("---WEB SEARCH---")
        if self.web_search_tool is None:
            raise RuntimeError("TAVILY_API_KEY is required to use the web search tool.")

        question = state["question"]
        documents = state.get("documents", [])
        docs = self.web_search_tool.invoke({"query": question})
        web_results = "\n".join([d["content"] for d in docs])
        documents.append(Document(page_content=web_results))
        return {"documents": documents, "question": question}

    def route_question(self, state: GraphState) -> str:
        print("---ROUTE QUESTION---")
        question = state["question"]
        source = self.question_router.invoke({"question": question})
        print(source)
        datasource = source.get("datasource")
        if datasource == "web_search":
            print("---ROUTE QUESTION TO WEB SEARCH---")
            return "websearch"
        print("---ROUTE QUESTION TO RAG---")
        return "vectorstore"

    def decide_to_generate(self, state: GraphState) -> str:
        print("---ASSESS GRADED DOCUMENTS---")
        web_search_flag = state.get("web_search", "No")
        if web_search_flag == "Yes":
            print(
                "---DECISION: ALL DOCUMENTS ARE NOT RELEVANT TO QUESTION, INCLUDE WEB SEARCH---"
            )
            return "websearch"
        print("---DECISION: GENERATE---")
        return "generate"

    def grade_generation_v_documents_and_question(self, state: GraphState) -> str:
        print("---CHECK HALLUCINATIONS---")
        question = state["question"]
        documents = state.get("documents", [])
        generation = state.get("generation") or ""
        documents_text = self._documents_to_text(documents)

        score = self.hallucination_grader.invoke(
            {"documents": documents_text, "generation": generation}
        )
        grade = score["score"]

        if grade == "yes":
            print("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---")
            print("---GRADE GENERATION vs QUESTION---")
            score = self.answer_grader.invoke({"question": question, "generation": generation})
            grade = score["score"]
            if grade == "yes":
                print("---DECISION: GENERATION ADDRESSES QUESTION---")
                return "useful"
            print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---")
            return "not useful"

        pprint("---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, RE-TRY---")
        return "not supported"

    def _build_workflow(self):
        workflow = StateGraph(GraphState)
        workflow.add_node("websearch", self.web_search)
        workflow.add_node("retrieve", self.retrieve)
        workflow.add_node("grade_documents", self.grade_documents)
        workflow.add_node("generate", self.generate)

        workflow.set_conditional_entry_point(
            self.route_question,
            {
                "websearch": "websearch",
                "vectorstore": "retrieve",
            },
        )
        workflow.add_edge("retrieve", "grade_documents")
        workflow.add_conditional_edges(
            "grade_documents",
            self.decide_to_generate,
            {
                "websearch": "websearch",
                "generate": "generate",
            },
        )
        workflow.add_edge("websearch", "generate")
        workflow.add_conditional_edges(
            "generate",
            self.grade_generation_v_documents_and_question,
            {
                "not supported": "generate",
                "useful": END,
                "not useful": "websearch",
            },
        )
        return workflow.compile()

    def _get_prompt(self, message: str, chat_history: List[tuple[str, str]]) -> str:
        texts = []
        do_strip = False
        for user_input, response in chat_history:
            user_input = user_input.strip() if do_strip else user_input
            do_strip = True
            texts.append(
                f"<|start_header_id|>user<|end_header_id|>{user_input} <|eot_id|>"
                f"<|start_header_id|>assistant<|end_header_id|> {response.strip()} <|eot_id|> "
            )
        message = message.strip() if do_strip else message
        texts.append(f"<|start_header_id|>user<|end_header_id|> {message} <|eot_id|>")
        return "".join(texts)

    def run(self, message: str, documents: List[Document], chat_history: List[tuple[str, str]]) -> str:
        question = self._get_prompt(message, chat_history)
        inputs: GraphState = {
            "question": question,
            "documents": documents or [],
            "web_search": "No",
            "generation": None,
        }
        result = None
        for output in self.app.stream(inputs):
            for key, value in output.items():
                pprint(f"Node '{key}':")
                result = value
            pprint("\n---\n")
        if result and "generation" in result:
            return result["generation"]
        return ""

