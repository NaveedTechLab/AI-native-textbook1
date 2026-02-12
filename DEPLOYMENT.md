# Deployment Guide

Complete deployment guide for AI-native Textbook Platform.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Auth Service  │────▶│    Backend      │
│  (Docusaurus)   │     │  (Better-Auth)  │     │    (FastAPI)    │
│   Port: 3000    │     │   Port: 3100    │     │   Port: 8001    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
    Vercel/HF            HuggingFace Space        HuggingFace Space
```

## 1. GitHub Deployment ✅

**Status**: Complete

**Repository**: https://github.com/NaveedTechLab/AI-native-textbook1.git

**Latest Commits**:
- feat: Complete RAG chatbot with ChatKit SDK and Better-Auth integration
- feat: Add Vercel deployment configuration

## 2. Vercel Deployment (Frontend)

### Prerequisites
- Vercel account
- GitHub repository connected

### Steps

1. **Login to Vercel**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select repository: `AI-native-textbook1`
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: cd frontend && npm run build
   Output Directory: frontend/build
   Install Command: cd frontend && npm install
   ```

4. **Environment Variables**
   ```
   NODE_ENV=production
   REACT_APP_API_URL=https://your-backend-url.hf.space/api
   REACT_APP_AUTH_URL=https://your-auth-url.hf.space
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at: `https://your-project.vercel.app`

### Custom Domain (Optional)
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

## 3. HuggingFace Spaces Deployment

### 3.1 Frontend Space

**Space URL**: https://huggingface.co/spaces/Naveed247365/ai-textbook-frontend

#### Method 1: Web Interface (Recommended)

1. **Login to HuggingFace**
   - Visit: https://huggingface.co
   - Login with your account

2. **Navigate to Space**
   - Go to: https://huggingface.co/spaces/Naveed247365/ai-textbook-frontend
   - Click "Files" tab

3. **Sync from GitHub**
   - Click "Settings" → "Sync from GitHub"
   - Enter repository: `NaveedTechLab/AI-native-textbook1`
   - Select branch: `main`
   - Set path: `frontend/`
   - Click "Sync"

#### Method 2: Git Push

1. **Generate New Token**
   - Visit: https://huggingface.co/settings/tokens
   - Create new token with "write" access
   - Copy the token

2. **Add Remote and Push**
   ```bash
   cd "E:\hakaton 1\AI-native-textbook"

   # Add HuggingFace remote
   git remote add hf https://YOUR_USERNAME:YOUR_TOKEN@huggingface.co/spaces/Naveed247365/ai-textbook-frontend

   # Push to HuggingFace
   git push hf main --force
   ```

#### Required Files for HuggingFace
- `Dockerfile` (already present in frontend/)
- `requirements.txt` (if needed)
- `.env.example` for environment variables

### 3.2 Backend Space

**Space URL**: https://huggingface.co/spaces/Naveed247365/ai-textbook-backend

#### Setup Steps

1. **Create/Update Space**
   - Space type: Docker
   - SDK: Docker
   - Hardware: CPU Basic (or GPU if needed)

2. **Environment Variables** (in Space Settings)
   ```
   OPENAI_API_KEY=your_openrouter_api_key
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_api_key
   NEON_DB_URL=your_neon_db_url
   SECRET_KEY=your_secret_key
   BETTER_AUTH_URL=https://your-auth-space.hf.space
   ```

3. **Push Backend Code**
   ```bash
   # Add backend remote
   git remote add hf-backend https://YOUR_USERNAME:YOUR_TOKEN@huggingface.co/spaces/Naveed247365/ai-textbook-backend

   # Push backend
   git subtree push --prefix backend hf-backend main
   ```

### 3.3 Auth Service Space

**Space URL**: https://huggingface.co/spaces/Naveed247365/ai-textbook-auth

#### Setup Steps

1. **Create Space**
   - Space type: Docker
   - SDK: Docker
   - Hardware: CPU Basic

2. **Environment Variables**
   ```
   DATABASE_URL=your_neon_postgres_url
   BETTER_AUTH_SECRET=your_secret_min_32_chars
   BETTER_AUTH_URL=https://your-auth-space.hf.space
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_URL=https://your-frontend.vercel.app
   PORT=7860
   ```

3. **Push Auth Service**
   ```bash
   # Add auth remote
   git remote add hf-auth https://YOUR_USERNAME:YOUR_TOKEN@huggingface.co/spaces/Naveed247365/ai-textbook-auth

   # Push auth service
   git subtree push --prefix auth-service hf-auth main
   ```

## 4. Docker Compose (Local Development)

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Steps

1. **Create Environment Files**

   **backend/.env**:
   ```env
   OPENAI_API_KEY=your_openrouter_api_key
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=your_qdrant_api_key
   NEON_DB_URL=your_neon_db_url
   SECRET_KEY=your_secret_key
   BETTER_AUTH_URL=http://auth-service:3100
   ```

   **auth-service/.env**:
   ```env
   DATABASE_URL=your_neon_postgres_url
   BETTER_AUTH_SECRET=your_secret_min_32_chars
   BETTER_AUTH_URL=http://localhost:3100
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_URL=http://localhost:3000
   PORT=3100
   ```

2. **Start Services**
   ```bash
   cd "E:\hakaton 1\AI-native-textbook"
   docker-compose up -d
   ```

3. **Access Services**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8001
   - Auth Service: http://localhost:3100

4. **Stop Services**
   ```bash
   docker-compose down
   ```

## 5. Environment Variables Reference

### Frontend
- `NODE_ENV`: production/development
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_AUTH_URL`: Auth service URL

### Backend
- `OPENAI_API_KEY`: OpenRouter API key
- `OPENAI_BASE_URL`: https://openrouter.ai/api/v1
- `QDRANT_URL`: Qdrant instance URL
- `QDRANT_API_KEY`: Qdrant API key
- `NEON_DB_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `BETTER_AUTH_URL`: Auth service URL

### Auth Service
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Min 32 characters
- `BETTER_AUTH_URL`: Auth service public URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth secret
- `FRONTEND_URL`: Frontend URL for CORS
- `PORT`: Service port (default: 3100)

## 6. Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend API responding at /health endpoint
- [ ] Auth service responding at /health endpoint
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Qdrant collection created
- [ ] OAuth providers configured
- [ ] SSL certificates active
- [ ] Custom domains configured (if applicable)

## 7. Troubleshooting

### Frontend Build Fails
- Check Node.js version (18.x recommended)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

### Backend API Errors
- Verify environment variables
- Check OpenRouter API key validity
- Ensure Qdrant is accessible
- Check database connection

### Auth Service Issues
- Verify DATABASE_URL format
- Check BETTER_AUTH_SECRET length (min 32 chars)
- Ensure CORS origins include frontend URL

### CORS Errors
- Update backend CORS origins
- Check auth service CORS configuration
- Verify frontend API URLs

## 8. Monitoring & Logs

### Vercel
- Dashboard → Project → Deployments → View Logs

### HuggingFace
- Space → Logs tab
- Real-time logs available

### Docker Compose
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs auth-service

# Follow logs
docker-compose logs -f
```

## 9. Updating Deployments

### GitHub → Vercel (Auto-deploy)
```bash
git add .
git commit -m "your message"
git push origin main
# Vercel auto-deploys on push
```

### GitHub → HuggingFace
```bash
# Push to HuggingFace remote
git push hf main
git push hf-backend main
git push hf-auth main
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/NaveedTechLab/AI-native-textbook1/issues
- Documentation: See README.md files in each directory
