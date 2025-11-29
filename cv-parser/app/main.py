# app/main.py
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from features.llm_client.llm_client import LLMClient
from features.pdf_parser.pdf_parser import PDFParser

app = FastAPI()
llm = LLMClient()
pdf_parser = PDFParser()

class ChatRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_llm(body: ChatRequest):
    answer = llm.chat(body.question)
    return {"answer": answer}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_content = PDFParser.parse_pdf(file.file)
    return {"filename": file.filename, "content_type": file.content_type, "content": file_content}


@app.get("/health")
def health_check():
    return {"message": "Docker + Fast API is running!"}
