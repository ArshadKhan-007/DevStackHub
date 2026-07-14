"""
Storage helpers.

Phase 1 (local development):
  - Images  → saved to EFS_MOUNT_PATH/images/   (local folder)
  - Documents → saved to EFS_MOUNT_PATH/documents/ (local folder, simulates S3)

Phase 2 (AWS):
  - Images  → same EFS path (real EFS mount)
  - Documents → uploaded to S3 via boto3
  Only .env values change, no code changes required.
"""

import os
import uuid
import shutil
import boto3

from fastapi import UploadFile
from dotenv import load_dotenv

load_dotenv()

EFS_MOUNT_PATH = os.getenv("EFS_MOUNT_PATH", "./local_storage")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"}


def _unique_filename(original: str) -> str:
    ext = os.path.splitext(original)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


def classify_file(filename: str) -> str:
    """Return 'image' or 'document' based on extension."""
    ext = os.path.splitext(filename)[1].lower()
    if ext in IMAGE_EXTENSIONS:
        return "image"
    return "document"


async def upload_image(file: UploadFile) -> tuple[str, str]:
    """
    Save an image to EFS_MOUNT_PATH/images/.
    Returns (storage_path, served_url_path).
    """
    dest_dir = os.path.join(EFS_MOUNT_PATH, "images")
    os.makedirs(dest_dir, exist_ok=True)

    unique_name = _unique_filename(file.filename)
    dest_path = os.path.join(dest_dir, unique_name)

    file.file.seek(0)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return dest_path, f"/static/images/{unique_name}"


async def upload_document(file: UploadFile) -> tuple[str, str]:
    """
    Phase 1: save document to local folder.
    Phase 2: upload to S3 (when ENVIRONMENT != 'development' and S3_BUCKET_NAME is set).
    Returns (storage_path/s3_key, served_path).
    """
    if ENVIRONMENT != "development" and S3_BUCKET_NAME:
        # ── S3 upload ─────────────────────────────────────────────────────
        s3 = boto3.client("s3", region_name=AWS_REGION)
        unique_name = _unique_filename(file.filename)
        s3_key = f"documents/{unique_name}"
        file.file.seek(0)
        s3.upload_fileobj(
            file.file,
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
        )
        return s3_key, f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    else:
        # ── Local fallback ────────────────────────────────────────────────
        dest_dir = os.path.join(EFS_MOUNT_PATH, "documents")
        os.makedirs(dest_dir, exist_ok=True)
        unique_name = _unique_filename(file.filename)
        dest_path = os.path.join(dest_dir, unique_name)
        file.file.seek(0)
        with open(dest_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return dest_path, f"/static/documents/{unique_name}"


def delete_file_from_storage(storage_path: str, file_type: str) -> None:
    """Delete a file from EFS (local) or S3."""
    if ENVIRONMENT != "development" and S3_BUCKET_NAME and file_type == "document":
        s3 = boto3.client("s3", region_name=AWS_REGION)
        s3.delete_object(Bucket=S3_BUCKET_NAME, Key=storage_path)
    else:
        if os.path.exists(storage_path):
            os.remove(storage_path)
