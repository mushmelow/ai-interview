# app/main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from features.llm_client.llm_client import LLMClient
from features.pdf_parser.pdf_parser import PDFParser
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pdf_parser = PDFParser()


class ChatRequest(BaseModel):
    cv_content: str
    job_description: str


@app.post("/analyze-cv")
async def analyze_cv(body: ChatRequest):
    answer = LLMClient.cv_analyzer(body.cv_content, body.job_description)
    return {"answer": answer}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_content = PDFParser.parse_pdf(file.file)
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "content": file_content,
    }


@app.get("/health")
def health_check():
    return {"message": "Docker + Fast API is running!"}
