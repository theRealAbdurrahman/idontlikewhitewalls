# Claude Memory File

## Important Guidelines
- **DO NOT** add Claude as co-author in commits or PRs
- When creating commits, do not include "Co-Authored-By: Claude" lines
- Keep commit messages clean and professional without AI attribution

## Project Context
- Working on MeetBall app - event networking platform
- Frontend: React/TypeScript with Vite
- Backend: FastAPI with PostgreSQL
- Key dependencies: @tanstack/react-query v5, tailwindcss v3.4
- Team is working on branch `staging`
- Always create feature branches and PRs targeting `staging`

## Recent Issues Fixed
- Question creation 422 error: caused by empty string event_id initialization
- Image upload system implemented with Cloudflare R2 and Worker
- Custom domain configured: `stdio.meetball.fun` (standard input/output - handles uploads and serving)

## Image Upload System
- **Domain**: `stdio.meetball.fun` 
- **Upload**: `POST /upload` - Direct image uploads to R2
- **Serving**: `GET /image/{object_key}` - Image serving from R2
- **Storage**: Cloudflare R2 bucket "demomeetball"
- **Security**: Origin validation for `*.meetball.fun` domains
- **Components**: ProfileImageUploadSimple, EventImageUploadSimple, SimpleImageUpload
- **Hook**: useSimpleImageUpload for frontend integration