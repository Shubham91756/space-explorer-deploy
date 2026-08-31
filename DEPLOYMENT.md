# Production Deployment Checklist - Stellar.log

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] No `console.log()` statements left in production code
- [ ] Error handling is comprehensive
- [ ] Environment variables are properly set
- [ ] No hardcoded URLs or credentials
- [ ] Tests pass (if applicable)

### Backend Configuration
- [ ] `.env` file is in `.gitignore`
- [ ] `NODE_ENV=production` is set
- [ ] `CORS_ORIGIN` is set to production frontend URL
- [ ] `PORT` is correct for deployment platform
- [ ] Error logging is configured (optional: use Winston or Pino)
- [ ] Request timeout is reasonable (default: reasonable)

### Frontend Configuration
- [ ] `REACT_APP_API_BASE_URL` points to production backend
- [ ] `.env` file is in `.gitignore`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors or warnings
- [ ] Service worker configured (if using)
- [ ] Analytics configured (optional)

### Security
- [ ] CORS is restricted to your domains only
- [ ] No API keys exposed in frontend code
- [ ] HTTPS is enforced
- [ ] Rate limiting is configured (optional)
- [ ] Input validation on both frontend and backend
- [ ] SQL injection prevention (if using database)

### Performance
- [ ] Caching is properly configured (24-hour TTL)
- [ ] Bundle size is optimized
- [ ] Images are optimized
- [ ] Gzip compression is enabled
- [ ] CDN is configured (optional)

---

## 📋 Deployment Platforms

### Option 1: Render (Recommended for Beginners)

#### Deploy Backend

```bash
# 1. Push to GitHub
git push origin main

# 2. Create new Web Service on Render
# - Name: stellar-log-backend
# - GitHub repo: <your-repo>
# - Root directory: server
# - Build command: npm install
# - Start command: npm start

# 3. Set environment variables in Render dashboard:
# PORT=10000 (or Render's default)
# NODE_ENV=production
# CORS_ORIGIN=https://yourdomain.com
```

#### Deploy Frontend

```bash
# 1. Build locally
npm run build

# 2. Create new Static Site on Render
# - Name: stellar-log-frontend
# - GitHub repo: <your-repo>
# - Build command: npm run build
# - Publish directory: build

# 3. Set environment variable:
# REACT_APP_API_BASE_URL=https://stellar-log-backend.onrender.com
```

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variable:
#    REACT_APP_API_BASE_URL=https://your-backend-url.com

# Vercel automatically runs: npm run build
```

#### Backend on Railway
```bash
# 1. Connect GitHub repo to Railway
# 2. Point to /server directory
# 3. Set environment variables in Railway dashboard:
#    PORT, NODE_ENV, CORS_ORIGIN

# Railway automatically runs: npm start
```

### Option 3: Self-Hosted (VPS/DigitalOcean)

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Setup Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 for process management
sudo npm install -g pm2

# 4. Clone your repo
git clone https://github.com/yourusername/stellar-log.git
cd stellar-log

# 5. Setup backend
cd server
npm install --production
cp .env.example .env
# Edit .env with production values

# 6. Start backend with PM2
pm2 start server.js --name "stellar-backend"
pm2 save
pm2 startup

# 7. Build and deploy frontend
cd ..
npm install
npm run build

# 8. Serve with Nginx
# Copy build/ contents to /var/www/stellar-frontend
# Configure Nginx to serve frontend and proxy /api/* to backend
```

---

## 🔒 Environment Variables Template

### Production Backend (.env)
```
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Optional: Database URL (if adding database later)
# DATABASE_URL=postgresql://user:password@host:5432/db

# Optional: Analytics (if adding monitoring)
# SENTRY_DSN=https://...
```

### Production Frontend (.env.production)
```
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production

# Optional: Analytics
# REACT_APP_GOOGLE_ANALYTICS_ID=UA-...
```

---

## 📊 Post-Deployment Verification

### Checklist

- [ ] Health check endpoint responds: `/api/health`
- [ ] Space history endpoint works: `/api/space-history?date=01-15`
- [ ] Frontend loads without errors
- [ ] Date selection works
- [ ] Events display correctly
- [ ] Cache is working (check `cached: true` on second request)
- [ ] CORS headers are correct
- [ ] HTTPS certificate is valid
- [ ] No console errors in browser (F12)
- [ ] Network requests show correct backend URL

### Manual Testing

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Frontend loads
curl https://yourdomain.com | grep "Stellar.log"

# API functionality
curl "https://api.yourdomain.com/api/space-history?date=01-15"
```

---

## 🔄 Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Render
        env:
          RENDER_DEPLOY_KEY: ${{ secrets.RENDER_DEPLOY_KEY }}
        run: |
          curl https://api.render.com/deploy/srv-xxx?key=$RENDER_DEPLOY_KEY
```

---

## 📈 Monitoring & Maintenance

### Recommended Tools

- **Uptime Monitoring:** StatusPage.io, Uptime Robot
- **Error Tracking:** Sentry, Rollbar
- **Performance Monitoring:** New Relic, DataDog
- **Log Aggregation:** Loggly, Papertrail

### Daily Checks

- [ ] Health check endpoint responds
- [ ] No error spikes in logs
- [ ] Cache hit rate is high (>80%)
- [ ] Response times are acceptable (<500ms)
- [ ] No CORS errors from users

---

## 🆘 Rollback Procedure

If something goes wrong:

```bash
# Option 1: Rollback via Git
git revert <commit-hash>
git push origin main
# Deployment platform will redeploy automatically

# Option 2: Manual Rollback (if using PM2)
pm2 restart stellar-backend
pm2 save

# Option 3: Switch to previous version
git checkout <previous-tag>
npm run build
# Redeploy
```

---

## 🎯 Key Production URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://yourdomain.com | Main app |
| Backend API | https://api.yourdomain.com | API endpoint |
| Health Check | https://api.yourdomain.com/api/health | Monitor backend |
| Cache Info | https://api.yourdomain.com/api/space-history/cache/info | Debug cache |

---

## 📞 Support

If deployment fails:

1. Check deployment logs on your platform
2. Verify environment variables are set correctly
3. Test backend locally before deploying
4. Check CORS configuration matches frontend URL
5. Ensure Node.js version compatibility

---

**You're ready to launch! 🚀**
