# Backend Redeployment Guide

This guide will help you redeploy your backend to Railway to fix the current "Unexposed service" and port issues.

## Issues Fixed
- ✅ Port environment variable expansion issue (`$PORT` not being converted to integer)
- ✅ Proper Dockerfile configuration for Railway deployment
- ✅ Working directory and application startup

## Steps to Redeploy Backend

### Step 1: Verify Changes Are Pushed to GitHub
Make sure all the recent fixes are pushed to your repository:
```bash
cd "/mnt/e/hakaton 1/AI-native-textbook"
git add .
git commit -m "fix: backend deployment issues with port variable expansion"
git push origin main
```

### Step 2: Redeploy on Railway

#### Option A: Redeploy Existing Project
1. Go to your Railway dashboard: https://railway.app
2. Select your backend project
3. Click on the "Deployments" tab
4. Click the "Redeploy" button
5. Wait for the deployment to complete
6. Check the logs for any errors

#### Option B: Create New Project (Recommended)
1. Go to your Railway dashboard: https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your `AI-native-textbook1` repository
4. The root Dockerfile will be automatically detected
5. Set your environment variables:
   - `OPENAI_API_KEY`: Your OpenRouter API key
   - `OPENAI_BASE_URL`: `https://openrouter.ai/api/v1`
   - `QDRANT_URL`: Your Qdrant database URL
   - `QDRANT_API_KEY`: Your Qdrant API key
   - `QDRANT_COLLECTION`: Collection name (e.g., `project_documents`)
   - `NEON_DB_URL`: Your Neon database connection string
   - `SECRET_KEY`: A random secret key for JWT
   - `DEBUG`: `false` for production
   - `LOG_LEVEL`: `info`
6. Click "Deploy"

### Step 3: Verify the Deployment
1. Once deployed, you should see a proper URL instead of "Unexposed service"
2. The URL will look like: `https://your-project-name-xyz123.railway.app`
3. Test the health endpoint: `GET /health`
4. Verify it returns: `{"status": "healthy"}`

### Step 4: Update Frontend Configuration
After your backend is deployed:
1. Get the new backend URL from Railway
2. Update your `frontend/vercel.json` file:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-new-backend-url.railway.app/api/:path*"
       }
     ]
   }
   ```

## Troubleshooting

### If You Still See "Unexposed service":
- Make sure the PORT environment variable is being set by Railway (it should be automatic)
- Check that your Dockerfile is using the corrected CMD instruction
- Verify that the application is binding to `0.0.0.0` instead of `localhost`

### If Deployment Fails:
- Check the deployment logs in Railway dashboard
- Ensure all environment variables are properly set
- Make sure the repository is up to date with the latest fixes

### Port Issues:
- The corrected Dockerfile now properly converts `$PORT` to an integer using Python's `int()` function
- If you're still having port issues, make sure Railway is providing the PORT environment variable

## Expected Outcome
After redeployment, you should see:
- ✅ A proper URL instead of "Unexposed service"
- ✅ Successful deployment with no port-related errors
- ✅ Working health check at `/health` endpoint
- ✅ Proper API functionality

## Next Steps
1. Once the backend is working, redeploy the frontend to Vercel with the updated backend URL
2. Test the complete application functionality
3. Verify the chatbot and API integration work properly