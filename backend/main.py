from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Body
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
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        file_bytes = await file.read()
        size_kb = round(len(file_bytes) / 1024, 2)

        text = ""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        doc.close()

        db = SessionLocal()
        
        # Check if file already exists
        existing_doc = db.query(Document).filter(Document.filename == file.filename).first()
        if existing_doc:
            db.close()
            raise HTTPException(
                status_code=400, 
                detail=f"A file named '{file.filename}' already exists"
            )
        
        # Get groups and validate they exist
        groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
        if len(groups) != len(group_ids):
            db.close()
            raise HTTPException(status_code=400, detail="One or more group IDs are invalid")

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

        return {
            "filename": file.filename,
            "size_kb": size_kb,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 📤 Multiple files upload endpoint
@app.post("/upload-multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    group_ids: str = Form(...)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    errors = []
    
    db = SessionLocal()
    
    # Convert group_ids string to list
    try:
        group_id = int(group_ids)
        group_ids_list = [group_id]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group ID format")
    
    # Validate groups
    groups = db.query(Group).filter(Group.id.in_(group_ids_list)).all()
    if len(groups) != len(group_ids_list):
        db.close()
        raise HTTPException(status_code=400, detail="One or more group IDs are invalid")
    
    try:
        for file in files:
            try:
                if not file.filename.endswith(".pdf"):
                    errors.append({
                        "filename": file.filename,
                        "error": "Not a PDF file"
                    })
                    continue

                # Check if file already exists
                existing_doc = db.query(Document).filter(Document.filename == file.filename).first()
                if existing_doc:
                    errors.append({
                        "filename": file.filename,
                        "error": "File already exists"
                    })
                    continue

                file_bytes = await file.read()
                size_kb = round(len(file_bytes) / 1024, 2)

                text = ""
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                for page in doc:
                    text += page.get_text()
                doc.close()

                doc_entry = Document(
                    filename=file.filename,
                    size_kb=size_kb,
                    text=text,
                    pdf_data=file_bytes,
                    groups=groups
                )
                db.add(doc_entry)
                
                results.append({
                    "filename": file.filename,
                    "size_kb": size_kb,
                    "status": "success"
                })

            except Exception as e:
                errors.append({
                    "filename": file.filename,
                    "error": str(e)
                })

        # Commit all successful uploads
        db.commit()
        
    finally:
        db.close()

    return {
        "successful_uploads": results,
        "errors": errors
    }

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

class RenameRequest(BaseModel):
    new_filename: str

@app.put("/documents/{filename}/rename")
async def rename_document(filename: str, rename_request: RenameRequest):
    if not rename_request.new_filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="New filename must end with .pdf")
        
    db = SessionLocal()
    try:
        # Check if new filename already exists
        existing = db.query(Document).filter(Document.filename == rename_request.new_filename).first()
        if existing:
            raise HTTPException(status_code=400, detail="A document with this name already exists")
            
        # Find and update the document
        document = db.query(Document).filter(Document.filename == filename).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        document.filename = rename_request.new_filename
        db.commit()
        
        return {"message": "Document renamed successfully"}
    finally:
        db.close()