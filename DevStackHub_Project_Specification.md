# DevStack Hub — Project Specification

## Project Overview

DevStack Hub is a full-stack app where developers manage their
profile, showcase projects, upload documents, and organize
dev-related resources from a dashboard. Built and tested fully with
placeholder config first, then deployed to AWS on 2 EC2 instances.

------------------------------------------------------------------------

# Tech Stack

## Frontend
- React, Vite, React Router, Axios

## Backend
- Python, FastAPI, Uvicorn
- JWT Authentication — `python-jose` or `pyjwt`
- File uploads — `python-multipart` (FastAPI's `UploadFile`)
- Runs inside a Python virtual environment (`venv`)

## Database
- Amazon RDS (MySQL)

------------------------------------------------------------------------

# Core Features

## Authentication
Register, Login, JWT Authentication, Logout

## Dashboard
Total Projects, Uploaded Files, Storage Used, Recent Activity

## User Profile
Name, Email, Bio, Skills, Experience, Profile Picture

## Project Management
Create / View / Update / Delete
Fields: Title, Description, Technologies Used, GitHub Repository,
Live Demo, Project Thumbnail

## File Manager
Upload / View / Download / Delete
Supported: Images, PDF, Resume, Documentation, Presentation

## Search
Search Projects, Search Files

## Activity Log
Login, Project Created, Project Updated, File Uploaded, Profile Updated

## Settings
Update Profile, Change Password

------------------------------------------------------------------------

# AWS Architecture

## Region
`us-east-1`

## EC2
- 2 instances, same app code deployed independently on each
- Both mount the same EFS at the same path
- Both connect to the same RDS instance
- Both use the same S3 bucket
- IAM role attached to both instances for S3/EFS access — no access
  keys anywhere in code or `.env`

## Amazon RDS
- MySQL, connection via environment variables only

## Amazon S3 — Documents
- Resume, Documentation, Presentations, generic PDFs

## Amazon EFS — Images
- Profile Pictures, Project Thumbnails
- Mounted at `EFS_MOUNT_PATH` on both EC2 instances
- Upload via Server A → immediately visible via Server B — same mount

**Rule:** images always go to EFS, documents always go to S3. Never mixed.

------------------------------------------------------------------------

# Upload Logic

**Images → EFS**
```python
import os, shutil
from fastapi import UploadFile

async def upload_image(file: UploadFile):
    dest_dir = os.path.join(os.environ["EFS_MOUNT_PATH"], "images")
    os.makedirs(dest_dir, exist_ok=True)
    with open(os.path.join(dest_dir, file.filename), "wb") as f:
        shutil.copyfileobj(file.file, f)
```
Served back via FastAPI `StaticFiles` mounted on `EFS_MOUNT_PATH`.

**Documents → S3**
```python
import boto3, os
from fastapi import UploadFile

s3 = boto3.client("s3", region_name=os.environ["AWS_REGION"])

async def upload_document(file: UploadFile):
    s3.upload_fileobj(
        file.file,
        os.environ["S3_BUCKET_NAME"],
        f"documents/{file.filename}",
    )
```

------------------------------------------------------------------------

# Development Guidelines
- Keep frontend and backend separate
- REST APIs, modular architecture, reusable code
- Production-ready folder structure
- Never hardcode AWS resources — env vars everywhere
- Images → EFS only. Documents → S3 only. No exceptions.

------------------------------------------------------------------------

# Environment Configuration (.env)

```env
PORT=5000
ENVIRONMENT=development

JWT_SECRET=replace_with_secure_secret

DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_NAME=devstackhub
DB_USER=your_database_username
DB_PASSWORD=your_database_password

AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

EFS_MOUNT_PATH=/mnt/efs

CLIENT_URL=http://localhost:5173
```

Placeholder values during development. Real AWS values only requested
after Phase 1 is complete.

Run command:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5000
```

------------------------------------------------------------------------

# Development Workflow

## Phase 1
- Build the complete application with placeholder config
- Implement every feature, frontend and backend fully connected
- Locally, `EFS_MOUNT_PATH` can point to a local folder

## Phase 2
After Phase 1 is fully functional, stop and respond with:

> The application is now fully functional. Please provide the production
> AWS configuration so I can integrate everything properly.

Then request:
- RDS Endpoint, DB Name, Username, Password
- S3 Bucket Name
- EFS Mount Path (as mounted on both EC2 instances)

Source code should not require modification — only environment
configuration changes.
