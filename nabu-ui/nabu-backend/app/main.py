# app.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .s3_client import put_bytes, put_json, list_prefix, scribe_key, presign_get
from .config import settings
import os
import mimetypes
from pydantic import BaseModel, Field


# local S3 helper
from .s3_client import put_bytes, put_json, list_prefix, scribe_key, presign_get

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]

app = FastAPI(title="Nabu Storage API (minimal)", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SaveContentRequest(BaseModel):
    content: str
    metadata: dict = Field(default_factory=dict)

class SaveContentResponse(BaseModel):
    key: str
    uri: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/upload/file", response_model=SaveContentResponse)
async def upload_file(scribe_id: str = Form(...), file: UploadFile = File(...)):
    try:
        filename = file.filename or "file"
        key = scribe_key(prefix="uploads", scribe_id=scribe_id, name=filename)
        data = await file.read()
        ctype = file.content_type or (mimetypes.guess_type(filename)[0] or "application/octet-stream")
        uri = put_bytes(key, data, ctype)
        return SaveContentResponse(key=key, uri=uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {e}")

@app.post("/scribes/{scribe_id}/content", response_model=SaveContentResponse)
async def save_content(scribe_id: str, body: SaveContentRequest):
    try:
        key = scribe_key(prefix="notes", scribe_id=scribe_id, name="content.json")
        payload = {"scribe_id": scribe_id, "content": body.content, "metadata": body.metadata}
        uri = put_json(key, payload)
        return SaveContentResponse(key=key, uri=uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 put_json failed: {e}")

@app.get("/scribes/{scribe_id}/items")
def list_items(scribe_id: str):
    try:
        return {"items": list_prefix(f"scribes/{scribe_id}/")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 list failed: {e}")

@app.get("/download/url")
def download_url(key: str, expires_in: int = 3600):
    try:
        return {"url": presign_get(key, expires_in)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 presign failed: {e}")
