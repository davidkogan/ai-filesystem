from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import fitz
from fastapi.responses import JSONResponse
from fastapi.responses import PlainTextResponse
from fastapi import HTTPException

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/ping")
def ping():
    return {"message": "Backend is up!"}

@app.get("/documents")
def list_documents():
    files = []
    for fname in os.listdir(UPLOAD_DIR):
        if fname.endswith(".pdf"):
            path = os.path.join(UPLOAD_DIR, fname)
            txt_path = path + ".txt"
            text = ""
            if os.path.exists(txt_path):
                with open(txt_path, "r") as f:
                    text = f.read()
            files.append({
                "filename": fname,
                "size_kb": round(os.path.getsize(path) / 1024, 2),
                "text_preview": text[:500]
            })
    return JSONResponse(content={"documents": files})

@app.get("/document/{filename}")
def get_document_text(filename: str):
    txt_path = os.path.join(UPLOAD_DIR, filename + ".txt")
    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail="Text file not found")
    with open(txt_path, "r") as f:
        text = f.read()
    return PlainTextResponse(content=text)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)

    # Save the uploaded file
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # Extract text from PDF if it's a PDF file
    text = ""
    if file.filename.endswith(".pdf"):
        doc = fitz.open(file_location)
        for page in doc:
            text += page.get_text()
        doc.close()

    with open(file_location + ".txt", "w") as out:
        out.write(text)

    return {
        "filename": file.filename,
        "status": "uploaded and processed",
        "text": text
    }