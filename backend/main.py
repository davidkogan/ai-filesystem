from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, PlainTextResponse
import os
import fitz  # PyMuPDF

app = FastAPI()

# 🔐 Allow Angular frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📁 Directory to store uploaded PDFs and extracted text
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ Health check
@app.get("/ping")
def ping():
    return {"message": "Backend is up!"}

# 📤 Upload endpoint
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_location, "wb") as f:
        f.write(await file.read())

    # 📄 Extract text using PyMuPDF
    text = ""
    if file.filename.endswith(".pdf"):
        doc = fitz.open(file_location)
        for page in doc:
            text += page.get_text()
        doc.close()

        # 📝 Save extracted text to .txt
        with open(file_location + ".txt", "w") as out:
            out.write(text)

    return {
        "filename": file.filename,
        "status": "uploaded and processed"
    }

# 📄 List uploaded documents
@app.get("/documents")
def list_documents():
    files = []
    for fname in os.listdir(UPLOAD_DIR):
        if fname.endswith(".pdf"):
            path = os.path.join(UPLOAD_DIR, fname)
            files.append({
                "filename": fname,
                "size_kb": round(os.path.getsize(path) / 1024, 2)
            })
    return JSONResponse(content={"documents": files})

# 📖 Serve actual PDF for viewing
@app.get("/file/{filename}")
def get_pdf_file(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type='application/pdf')

# 📃 (Optional) Serve extracted plain text for future AI use
@app.get("/document/{filename}")
def get_document_text(filename: str):
    txt_path = os.path.join(UPLOAD_DIR, filename + ".txt")
    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail="Text file not found")
    with open(txt_path, "r") as f:
        text = f.read()
    return PlainTextResponse(content=text)