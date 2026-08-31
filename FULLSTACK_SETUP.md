# Stellar.log Full-Stack Setup Guide

> **This document covers the complete setup, configuration, and deployment of Stellar.log as a production-grade full-stack application.**

---

## 📋 Table of Contents

1. [Project Architecture](#project-architecture)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [API Documentation](#api-documentation)
7. [Caching Strategy](#caching-strategy)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Project Architecture

```
Stellar.log (Full-Stack)
│
├── Frontend (React)
│   ├── src/
│   │   ├── components/
│   │   │   └── ContentSection.js (refactored to use backend API)
│   │   ├── utils/
│   │   │   └── spaceEventAPI.js (API client)
│   │   └── fetchTodayEvents.js (refactored)
│   ├── .env (API base URL)
│   └── package.json
│
├── Backend (Express.js)
│   ├── server.js (main server with CORS & middleware)
│   ├── routes/
│   │   └── spaceHistory.js (proxy endpoint with caching)
│   ├── .env (port, CORS origin)
│   └── package.json
│
└── Documentation
    └── FULLSTACK_SETUP.md (this file)
```

### Data Flow

```
User selects date in React UI
    ↓
React calls SpaceEventAPIClient.getHistoricalEvents()
    ↓
Request sent to http://localhost:5000/api/space-history?date=MM-DD
    ↓
Backend checks cache (NodeCache with 24-hour TTL)
    ↓
Cache HIT? → Return cached data instantly
    ↓
Cache MISS? → Fetch from Wikipedia API → Cache result → Return
    ↓
React receives data → Classify events → Display on UI
```

---

## 📋 Prerequisites

### Required Software

- **Node.js** (v16.x or higher) - [Download](https://nodejs.org/)
- **npm** (v8.x or higher) - Comes with Node.js
- **Git** (for version control)

### Verify Installation

```bash
node --version    # Should be v16.x or higher
npm --version     # Should be v8.x or higher
```

---

## 🚀 Local Development Setup

### Step 1: Clone/Navigate to Project

```bash
cd /path/to/space-explorer-deploy-main
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### Step 4: Configure Environment Variables

**Frontend (.env file in root)**
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

**Backend (server/.env file)**
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

> **Note:** Copy `.env.example` files if you don't have `.env` files yet:
> ```bash
> cp .env.example .env
> cp server/.env.example server/.env
> ```

---

## 🌍 Environment Variables

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | `http://localhost:5000` | Backend server URL |

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port number |
| `NODE_ENV` | `development` | Environment mode (development/production) |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend origin for CORS |

---

## ▶️ Running the Application

### Option 1: Run Both Servers (Recommended for Development)

#### Terminal 1 - Backend Server

```bash
cd server
npm start
```

You should see:
```
✅ Stellar.log Backend Server running on port 5000
📍 Environment: development
🔗 CORS Origin: http://localhost:3000
📡 API Health: http://localhost:5000/api/health
🚀 Space History API: http://localhost:5000/api/space-history?date=MM-DD
```

#### Terminal 2 - Frontend Development Server

```bash
npm start
```

The React app will open at `http://localhost:3000`

### Option 2: Run with Concurrently (Single Terminal)

First, install concurrently in the root:

```bash
npm install --save-dev concurrently
```

Add to root `package.json`:

```json
"scripts": {
  "dev": "concurrently \"npm start\" \"cd server && npm start\""
}
```

Then run:

```bash
npm run dev
```

---

## 📡 API Documentation

### Space History Endpoint

#### Request

```
GET http://localhost:5000/api/space-history?date=MM-DD
```

**Query Parameters:**

| Parameter | Type | Required | Format | Example |
|-----------|------|----------|--------|---------|
| `date` | string | Yes | `MM-DD` or `Month_Day` | `01-15` or `January_15` |

#### Response (Success - 200)

```json
{
  "data": {
    "month": 1,
    "day": 15,
    "totalEvents": 347,
    "spaceEventsCount": 12,
    "events": [
      {
        "year": "1969",
        "text": "Apollo 11 successfully landed on the Moon.",
        "image": "https://upload.wikimedia.org/...",
        "pages": [{ "pageid": 736, "title": "Apollo 11" }]
      },
      // ... more events
    ]
  },
  "cached": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Data served from cache"
}
```

#### Response (Error - 400)

```json
{
  "error": "Bad Request",
  "message": "Date format must be MM-DD or Month_Day",
  "example": "Use ?date=01-15 or ?date=January_15",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Response (Error - 500)

```json
{
  "error": "Internal Server Error",
  "message": "Failed to fetch from Wikipedia: [error details]",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Health Check Endpoint

```
GET http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Cache Info Endpoint (Debug)

```
GET http://localhost:5000/api/space-history/cache/info
```

**Response:**
```json
{
  "totalCachedEntries": 3,
  "entries": [
    {
      "key": "space-events-1-15",
      "cachedAt": "2024-01-15T10:00:00.000Z",
      "expiresAt": "2024-01-16T10:00:00.000Z",
      "eventsCount": 12
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 💾 Caching Strategy

### Cache Configuration

- **Library:** `node-cache`
- **TTL (Time-To-Live):** 24 hours (86400 seconds)
- **Storage:** In-memory JavaScript object
- **Key Format:** `space-events-{month}-{day}` (e.g., `space-events-1-15`)

### How Caching Works

1. **Cache Miss** (First Request for a Date)
   ```
   User requests date 01-15
   └─ Server checks cache → Not found
      └─ Fetches from Wikipedia API
         └─ Stores in cache with 24-hour TTL
            └─ Returns to user
            └─ Response: { cached: false, ... }
   ```

2. **Cache Hit** (Subsequent Requests)
   ```
   User requests date 01-15 again (within 24 hours)
   └─ Server checks cache → Found!
      └─ Returns instantly from cache
         └─ Response: { cached: true, ... }
   ```

### Monitoring Cache

Check what's currently cached:

```bash
curl http://localhost:5000/api/space-history/cache/info
```

### Benefits

✅ **Performance:** Eliminates Wikipedia API call on cache hit  
✅ **Cost:** Reduces API requests and bandwidth  
✅ **Reliability:** Returns cached data even if Wikipedia API is slow  
✅ **Scalability:** In-memory cache is faster than disk/network I/O  

---

## 🌐 Production Deployment

### Backend Deployment (Express Server)

#### Option A: Deploy to Render/Railway/Heroku

1. **Create `.env.production` for production:**
   ```
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Update start script** (if needed):
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

3. **Deploy** using your platform's CLI or Git integration

#### Option B: Deploy to Own Server (VPS)

```bash
# SSH into server
ssh user@your-server-ip

# Clone repo
git clone <your-repo-url>
cd space-explorer-deploy-main/server

# Install dependencies
npm install

# Set production environment variables
nano .env  # Edit with production values

# Start with PM2 (recommended for persistence)
npm install -g pm2
pm2 start server.js --name "stellar-backend"
pm2 save
```

### Frontend Deployment (React App)

1. **Build the React app:**
   ```bash
   npm run build
   ```

2. **Update `.env` for production:**
   ```
   REACT_APP_API_BASE_URL=https://your-backend-domain.com
   ```

3. **Deploy `build/` folder** to:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront
   - Your own server

### Docker Deployment (Optional)

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Build & Run

```bash
docker build -t stellar-backend .
docker run -p 5000:5000 -e CORS_ORIGIN=https://yourdomain.com stellar-backend
```

---

## 🔧 Troubleshooting

### Issue 1: Backend Server Won't Start

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:** Port 5000 is already in use
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or use a different port
PORT=5001 npm start
```

### Issue 2: CORS Error in Browser

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:** Update `server/.env`:
```
CORS_ORIGIN=http://localhost:3000  # or your frontend URL
```

### Issue 3: API Returning 502 Bad Gateway

**Error:** `Failed to fetch from Wikipedia: Wikipedia API returned 503`

**Solution:** Wikipedia API is temporarily unavailable
- Check Wikipedia status: https://en.wikipedia.org/
- Retry request (data should be in cache if requested before)
- Implement fallback data

### Issue 4: React App Can't Find Backend

**Error:** `Failed to fetch historical events - network error`

**Solution:** Check:
1. Backend is running: `curl http://localhost:5000/api/health`
2. `REACT_APP_API_BASE_URL` is correct in `.env`
3. Backend CORS is configured for frontend origin

### Issue 5: Cache Not Working

**Verify caching:**
```bash
# Check what's cached
curl http://localhost:5000/api/space-history/cache/info

# First request should show cached: false
curl "http://localhost:5000/api/space-history?date=01-15"

# Second request should show cached: true
curl "http://localhost:5000/api/space-history?date=01-15"
```

---

## 📚 File Structure

```
space-explorer-deploy-main/
├── public/
├── src/
│   ├── components/
│   │   ├── ContentSection.js (✅ UPDATED - uses backend API)
│   │   ├── Footer.js
│   │   └── ...
│   ├── utils/
│   │   ├── spaceEventAPI.js (✅ NEW - API client)
│   │   ├── classifyEvent.js
│   │   └── ...
│   ├── fetchTodayEvents.js (✅ UPDATED - uses backend API)
│   └── ...
├── server/
│   ├── routes/
│   │   └── spaceHistory.js (✅ NEW - proxy endpoint with cache)
│   ├── server.js (✅ NEW - main Express app)
│   ├── .env (✅ NEW - backend config)
│   ├── .env.example (✅ NEW - template)
│   ├── .gitignore (✅ NEW)
│   └── package.json (✅ NEW)
├── .env (✅ NEW - frontend config)
├── .env.example (✅ NEW - template)
├── package.json (root - no changes needed)
└── README.md
```

---

## 🎓 Key Improvements for Your Resume

✅ **Full-Stack Architecture:** Frontend + Backend separation of concerns  
✅ **API Design:** RESTful endpoint with proper error handling  
✅ **Performance Optimization:** Server-side caching reduces latency  
✅ **Security:** CORS configuration, error boundaries  
✅ **DevOps Ready:** Environment-based configuration for multiple environments  
✅ **Scalability:** Can handle multiple users without direct Wikipedia API calls  
✅ **Code Quality:** Clean separation of concerns, reusable API client  

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Documentation](#api-documentation)
3. Check backend logs: `npm start` output in terminal
4. Check browser console for frontend errors (F12)

---

**Happy exploring the universe! 🚀**
