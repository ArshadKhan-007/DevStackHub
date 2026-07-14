from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.database import get_db, Project, File, User
from schemas.schemas import SearchResult
from utils.auth import get_current_user

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResult)
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pattern = f"%{q}%"

    projects = (
        db.query(Project)
        .filter(
            Project.user_id == current_user.id,
            or_(
                Project.title.ilike(pattern),
                Project.description.ilike(pattern),
                Project.technologies.ilike(pattern),
            ),
        )
        .all()
    )

    files = (
        db.query(File)
        .filter(
            File.user_id == current_user.id,
            or_(
                File.original_name.ilike(pattern),
                File.file_type.ilike(pattern),
            ),
        )
        .all()
    )

    return SearchResult(projects=projects, files=files)
