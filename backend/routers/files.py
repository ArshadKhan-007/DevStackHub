from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from models.database import get_db, File as FileModel, ActivityLog, User
from schemas.schemas import FileOut
from utils.auth import get_current_user
from utils.storage import upload_image, upload_document, classify_file, delete_file_from_storage

router = APIRouter(prefix="/files", tags=["File Manager"])

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "text/markdown",
}


@router.get("", response_model=List[FileOut])
def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(FileModel).filter(FileModel.user_id == current_user.id).order_by(FileModel.created_at.desc()).all()


@router.post("/upload", response_model=FileOut, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"File type '{file.content_type}' is not allowed")

    file_type = classify_file(file.filename)

    # Read size
    content = await file.read()
    size_bytes = len(content)
    await file.seek(0)

    if file_type == "image":
        storage_path, _ = await upload_image(file)
    else:
        storage_path, _ = await upload_document(file)

    db_file = FileModel(
        user_id=current_user.id,
        filename=os.path.basename(storage_path),
        original_name=file.filename,
        file_type=file_type,
        mime_type=file.content_type,
        size_bytes=size_bytes,
        storage_path=storage_path,
    )
    db.add(db_file)

    log = ActivityLog(
        user_id=current_user.id,
        action="File Uploaded",
        detail=f"File: {file.filename} ({file_type})",
    )
    db.add(log)
    db.commit()
    db.refresh(db_file)
    return db_file


@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = db.query(FileModel).filter(FileModel.id == file_id, FileModel.user_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    # For local/EFS files — serve directly
    if os.path.exists(db_file.storage_path):
        return FileResponse(
            db_file.storage_path,
            filename=db_file.original_name,
            media_type=db_file.mime_type or "application/octet-stream",
        )

    raise HTTPException(status_code=404, detail="File not available on this server")


@router.delete("/{file_id}", status_code=204)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_file = db.query(FileModel).filter(FileModel.id == file_id, FileModel.user_id == current_user.id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    delete_file_from_storage(db_file.storage_path, db_file.file_type)

    log = ActivityLog(
        user_id=current_user.id,
        action="File Deleted",
        detail=f"File: {db_file.original_name}",
    )
    db.add(log)
    db.delete(db_file)
    db.commit()
