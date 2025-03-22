from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import fitz
from db import Document, init_db, SessionLocal
from fastapi.responses import Response
from pydantic import BaseModel
from db import Document, Group, init_db, SessionLocal
from typing import List
from fastapi import Form
from fastapi.security import OAuth2PasswordRequestForm
from auth import authenticate_user, create_access_token, get_current_user

app = FastAPI()

# ✅ Initialize DB (create tables if not already created)
init_db()

# 🔐 Allow Angular frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Health check
@app.get("/ping")
def ping():
    return {"message": "Backend is up!"}

@app.get("/groups")
def list_groups():
    db = SessionLocal()
    groups = db.query(Group).all()
    db.close()

    return [{"id": g.id, "name": g.name} for g in groups]


class GroupCreate(BaseModel):
    name: str

@app.post("/groups")
def create_group(group: GroupCreate):
    db = SessionLocal()
    existing = db.query(Group).filter(Group.name == group.name).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Group already exists")

    new_group = Group(name=group.name)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    db.close()
    return {"id": new_group.id, "name": new_group.name}

# 📤 Upload endpoint
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    group_ids: List[int] = Form(...)
):
    file_bytes = await file.read()
    size_kb = round(len(file_bytes) / 1024, 2)

    text = ""
    if file.filename.endswith(".pdf"):
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        doc.close()

    db = SessionLocal()
    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()

    doc_entry = Document(
        filename=file.filename,
        size_kb=size_kb,
        text=text,
        pdf_data=file_bytes,
        groups=groups
    )
    db.add(doc_entry)
    db.commit()
    db.close()

    return {"filename": file.filename, "status": "stored in DB with groups"}

# 📄 List uploaded documents
@app.get("/documents")
def list_documents():
    db = SessionLocal()
    docs = db.query(Document).all()
    db.close()

    return {
        "documents": [
            {
                "filename": d.filename,
                "size_kb": d.size_kb,
                "uploaded_at": d.uploaded_at.isoformat()
            }
            for d in docs
        ]
    }

@app.get("/groups-with-documents")
def get_groups_with_documents():
    db = SessionLocal()
    groups = db.query(Group).all()
    result = []

    for group in groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "documents": [
                {
                    "filename": doc.filename,
                    "size_kb": doc.size_kb,
                    "uploaded_at": doc.uploaded_at.isoformat()
                }
                for doc in group.documents
            ]
        })

    db.close()
    return result

# 📖 Serve actual PDF for viewing
@app.get("/document/{filename}")
def get_document_text(filename: str):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.filename == filename).first()
    db.close()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return PlainTextResponse(content=doc.text or "")

@app.get("/file/{filename}")
def serve_pdf_from_db(filename: str):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.filename == filename).first()
    db.close()

    if not doc or not doc.pdf_data:
        raise HTTPException(status_code=404, detail="PDF not found")

    return Response(content=doc.pdf_data, media_type="application/pdf")

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/protected-route")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello, {current_user['username']}!"}