# Railway Deployment Guide

This guide explains how to set up automatic deployment to Railway when changes are merged into the main branch on GitHub.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Railway CLI**: Install locally for testing (optional)

## Setup Steps

### 1. Railway Project Setup

1. **Connect GitHub Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Services**:
   Railway will automatically detect both your frontend and backend. You should see:
   - **Backend Service**: Detects `server/` directory with Node.js
   - **Frontend Service**: Detects root directory with Vite/React

### 2. Environment Variables Setup

#### Backend Service Variables:
```bash
NODE_ENV=production
PORT=${{ RAILWAY_PUBLIC_PORT }}
CLIENT_URL=${{ RAILWAY_PUBLIC_DOMAIN }}
```

#### Frontend Service Variables:
```bash
NODE_ENV=production
VITE_APP_ENVIRONMENT=production
VITE_API_URL=https://your-backend-service.up.railway.app
VITE_APP_NAME="Yahtzee Online"
VITE_APP_VERSION=1.0.0
```

### 3. GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add the following secrets:

#### Required Secrets:
- `RAILWAY_TOKEN`: Your Railway API token
  - Get from Railway Dashboard > Account Settings > Tokens
  - Click "Create Token" and copy the value

### 4. Automatic Deployment Configuration

The deployment workflow (`.github/workflows/deploy.yml`) will:

1. **Run Tests**: Lint, type-check, and test your code
2. **Build Frontend**: Create production build
3. **Deploy to Railway**: Push both frontend and backend
4. **Notify Status**: Report success/failure

#### Deployment Triggers:
- Direct push to `main` branch
- Merged pull requests to `main` branch

### 5. Railway Service Configuration

#### Backend Service Settings:
```toml
# Railway will use server/package.json
Root Directory: /server
Build Command: npm install
Start Command: npm start
Port: $PORT (automatically assigned)
```

#### Frontend Service Settings:
```toml
# Railway will use root package.json
Root Directory: /
Build Command: npm install && npm run build
Start Command: npm run preview
Port: $PORT (automatically assigned)
```

### 6. Custom Domain Setup (Optional)

1. In Railway Dashboard, go to your frontend service
2. Click "Settings" > "Domains"
3. Click "Generate Domain" or add custom domain
4. Update `VITE_API_URL` environment variable if needed

## Testing Your Deployment

### Local Testing Before Deploy:
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login to Railway
railway login

# Link to your project
railway link

# Test backend locally
cd server
npm start

# Test frontend locally (in new terminal)
npm run build
npm run preview
```

### Production Testing:
1. Make a small change to your code
2. Push to main branch
3. Check GitHub Actions tab for deployment status
4. Visit your Railway domain to test the live app

## Troubleshooting

### Common Issues:

#### 1. Environment Variables Not Set
**Problem**: App can't connect to backend
**Solution**: 
- Check Railway environment variables
- Ensure `VITE_API_URL` matches your backend domain
- Verify backend `CLIENT_URL` allows frontend domain

#### 2. Build Failures
**Problem**: GitHub Actions failing
**Solution**:
- Check build logs in GitHub Actions
- Ensure all dependencies are in `package.json`
- Test build locally: `npm run build`

#### 3. Connection Issues
**Problem**: Frontend can't connect to backend
**Solution**:
- Check CORS configuration in server
- Verify WebSocket configuration
- Test with browser dev tools network tab

#### 4. Railway Token Issues
**Problem**: Deployment fails with authentication error
**Solution**:
- Regenerate Railway token
- Update GitHub secret
- Ensure token has correct permissions

### Debugging Commands:

```bash
# Check Railway project status
railway status

# View logs
railway logs

# Connect to production environment
railway run bash

# Check environment variables
railway variables
```

## Production Monitoring

### Health Checks:
- Backend: `https://your-backend.up.railway.app/health`
- Frontend: Check if main page loads

### Performance:
- Monitor Railway dashboard for CPU/memory usage
- Check response times in browser dev tools
- Monitor WebSocket connection stability

### Scaling:
Railway auto-scales based on usage, but you can:
- Set resource limits in Railway dashboard
- Monitor usage and costs
- Configure auto-sleep for cost optimization

## Security Considerations

### Environment Variables:
- Never commit secrets to git
- Use Railway environment variables for all sensitive data
- Rotate tokens periodically

### CORS Configuration:
```javascript
// server/index.js
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
};
app.use(cors(corsOptions));
```

### HTTPS:
- Railway provides HTTPS by default
- Ensure all API calls use HTTPS in production
- Configure secure WebSocket connections (WSS)

## Cost Optimization

### Railway Pricing:
- Free tier includes $5/month credit
- Pay for what you use beyond free tier
- Monitor usage in Railway dashboard

### Optimization Tips:
- Enable auto-sleep for unused apps
- Optimize build times and bundle sizes
- Use Railway's built-in caching

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)
- [Socket.io Production Guide](https://socket.io/docs/v4/production-checklist/)

## Support

If you encounter issues:
1. Check Railway logs and GitHub Actions logs
2. Review this documentation
3. Check Railway's status page
4. Contact Railway support if needed

---

**Next Steps**: After deployment, consider adding:
- Error monitoring (Sentry)
- Analytics (Google Analytics)
- Performance monitoring
- Database integration (if needed)
- User authentication
- Game analytics and statistics 