# app/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from features.llm_client.llm_client import LLMClient

app = FastAPI()
llm = LLMClient()

class ChatRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_llm(body: ChatRequest):
    answer = llm.chat(body.question)
    return {"answer": answer}

@app.get("/health")
def health_check():
    return {"message": "Docker + Fast API is runningg!"}

