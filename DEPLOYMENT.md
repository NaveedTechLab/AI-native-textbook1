# Deployment Guide

This guide explains how to deploy the AI-native textbook application to Railway (backend) and Vercel (frontend).

## Backend Deployment (Railway)

### Prerequisites
- Railway account (https://railway.app)
- GitHub account

### Steps
1. **Fork this repository** to your GitHub account
2. **Sign in to Railway** using your GitHub account
3. **Create a new project** and select "Deploy from GitHub"
4. **Select your forked repository**
5. **Set environment variables** in Railway:
   - `OPENAI_API_KEY`: Your OpenRouter API key
   - `OPENAI_BASE_URL`: `https://openrouter.ai/api/v1`
   - `QDRANT_URL`: Your Qdrant database URL
   - `QDRANT_API_KEY`: Your Qdrant API key
   - `QDRANT_COLLECTION`: Collection name (e.g., `project_documents`)
   - `NEON_DB_URL`: Your Neon database connection string
   - `SECRET_KEY`: A random secret key for JWT
   - `DEBUG`: `false` for production
   - `LOG_LEVEL`: `info`
6. **Deploy** the project

### Important Notes
- Railway will automatically detect and use the `Dockerfile` in the backend directory
- The app will be accessible on a random railway.app URL (e.g., `https://your-project-12345.railway.app`)
- Update your frontend's proxy URL with this backend URL

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account

### Steps
1. **Fork this repository** to your GitHub account (if not done already)
2. **Sign in to Vercel** using your GitHub account
3. **Click "New Project"** and import your forked repository
4. **Configure the project**:
   - Framework Preset: `Other` or `Docusaurus`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Root Directory: `frontend`
5. **Set environment variables** (if needed):
   - `NODE_ENV`: `production`
6. **Deploy** the project

### Environment Variables for Frontend
- Update the `frontend/vercel.json` file to replace `<YOUR_BACKEND_URL>` with your actual Railway backend URL

## Environment Variables Required

### Backend (Railway)
```bash
OPENAI_API_KEY=your_openrouter_api_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=project_documents
NEON_DB_URL=your_neon_db_connection_string
SECRET_KEY=your_secret_key_here
DEBUG=false
LOG_LEVEL=info
```

### Frontend (Vercel)
No specific environment variables required, but you'll need to update the proxy URL in `vercel.json`.

## Configuration

### Updating API Proxy URL
In `frontend/vercel.json`, update the rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://<YOUR_BACKEND_URL>.railway.app/api/:path*"
    }
  ]
}
```

Replace `<YOUR_BACKEND_URL>` with your actual Railway deployment URL.

## Deployment Scripts

### For local development
```bash
# Start backend
cd backend
python -c "from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8001)"

# Start frontend
cd frontend
npm run start
```

### For production build
```bash
# Build frontend
cd frontend
npm run build
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure the backend allows the frontend's domain in `backend/main.py`
2. **API calls failing**: Check that the proxy URL in `vercel.json` matches your backend deployment
3. **Environment variables not set**: Verify all required environment variables are set in both Railway and Vercel

### Backend Health Check
After deployment, verify the backend is working:
```
GET https://your-backend-url.railway.app/health
```

Expected response: `{"status": "healthy"}`

### Frontend Build Issues
If the frontend build fails on Vercel:
- Ensure the `homepage` field in `package.json` is set correctly
- Verify the `build` script in `package.json` matches Docusaurus build command
- Check for any Node.js version compatibility issues

## Scaling

### Railway (Backend)
- Scale instances in the Railway dashboard
- Monitor resource usage and adjust accordingly
- Use Railway's built-in monitoring tools

### Vercel (Frontend)
- Vercel automatically scales static sites
- Monitor performance using Vercel Analytics
- Use Vercel's global edge network for faster loading