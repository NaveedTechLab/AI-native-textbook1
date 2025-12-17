# Deployment Scripts

## 1. Backend Deployment to Railway

### Prerequisites:
- Railway CLI installed: `npm install -g @railway/cli`
- Or use the web interface at https://railway.app

### Steps:

1. **Prepare your backend directory**:
   ```bash
   cd /path/to/your/AI-native-textbook/backend
   ```

2. **Login to Railway** (if using CLI):
   ```bash
   railway login
   ```

3. **Link your project** (if using CLI):
   ```bash
   railway init
   # Or link to existing project:
   # railway link <project-id>
   ```

4. **Set environment variables**:
   ```bash
   railway variables set OPENAI_API_KEY="your_openrouter_api_key"
   railway variables set OPENAI_BASE_URL="https://openrouter.ai/api/v1"
   railway variables set QDRANT_URL="your_qdrant_url"
   railway variables set QDRANT_API_KEY="your_qdrant_api_key"
   railway variables set QDRANT_COLLECTION="project_documents"
   railway variables set NEON_DB_URL="your_neon_db_connection_string"
   railway variables set SECRET_KEY="your_secret_key_here"
   railway variables set DEBUG="false"
   railway variables set LOG_LEVEL="info"
   ```

5. **Deploy**:
   ```bash
   # Using CLI:
   railway up

   # Or use the web interface by connecting your GitHub repo
   ```

6. **Get your deployment URL** from Railway dashboard.

## 2. Frontend Deployment to Vercel

### Prerequisites:
- Vercel CLI installed: `npm install -g vercel`
- Or use the web interface at https://vercel.com

### Steps:

1. **Prepare your frontend directory**:
   ```bash
   cd /path/to/your/AI-native-textbook/frontend
   ```

2. **Login to Vercel** (if using CLI):
   ```bash
   vercel login
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   # Using CLI:
   vercel --prod

   # Or use the web interface by connecting your GitHub repo
   ```

5. **Update the proxy configuration**:
   - In the `frontend/vercel.json` file, replace `<YOUR_BACKEND_URL>` with your actual Railway backend URL
   - If you're using the web interface, you can update this file before deploying

6. **Update the docusaurus.config.js**:
   - Replace `https://<your-vercel-url>.vercel.app` with your actual Vercel deployment URL

## 3. Environment Variables Reference

### Backend (Railway) - Required Variables:
- `OPENAI_API_KEY`: Your OpenRouter API key
- `OPENAI_BASE_URL`: `https://openrouter.ai/api/v1`
- `QDRANT_URL`: Your Qdrant database URL
- `QDRANT_API_KEY`: Your Qdrant API key
- `QDRANT_COLLECTION`: Collection name (e.g., `project_documents`)
- `NEON_DB_URL`: Your Neon database connection string
- `SECRET_KEY`: A random secret key for JWT
- `DEBUG`: `false` for production
- `LOG_LEVEL`: `info`

### Frontend (Vercel) - No specific variables needed, but ensure:
- The proxy URL in `vercel.json` points to your backend
- The URL in `docusaurus.config.js` matches your deployment

## 4. Verification Steps

### After Backend Deployment:
1. Visit: `https://<your-backend-url>.railway.app/health`
2. Should return: `{"status": "healthy"}`

### After Frontend Deployment:
1. Visit your Vercel URL
2. Test the chatbot functionality
3. Verify API calls are working through the proxy

## 5. Common Issues and Solutions

### Issue: API calls failing from frontend
**Solution**: Check that the proxy URL in `frontend/vercel.json` matches your backend deployment URL

### Issue: CORS errors
**Solution**: Ensure your backend allows requests from your frontend domain

### Issue: Build failures
**Solution**:
- For backend: Check that the Dockerfile is properly configured
- For frontend: Ensure all dependencies are correctly specified in package.json

## 6. Updating Deployments

### For Railway (Backend):
```bash
# If using CLI:
railway up

# Or push to GitHub and Railway will auto-deploy if connected
```

### For Vercel (Frontend):
```bash
# If using CLI:
vercel

# Or push to GitHub and Vercel will auto-deploy if connected
```

## 7. Monitoring and Logs

### Railway (Backend):
- Access logs through the Railway dashboard
- Monitor resource usage and scale as needed

### Vercel (Frontend):
- Access logs through the Vercel dashboard
- Monitor performance metrics and analytics