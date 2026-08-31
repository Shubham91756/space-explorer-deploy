# Quick Start Guide - Stellar.log Full-Stack

## ⚡ 5-Minute Setup

### Terminal 1: Start Backend

```bash
cd server
npm install
npm start
```

Expected output:
```
✅ Stellar.log Backend Server running on port 5000
📡 API Health: http://localhost:5000/api/health
```

### Terminal 2: Start Frontend

```bash
npm install  # if not already done
npm start
```

Expected output:
```
Compiled successfully!
You can now view in the browser: http://localhost:3000
```

### ✅ Test the Integration

1. Open http://localhost:3000 in your browser
2. Select a date in the calendar
3. Check browser console (F12) - should show API call to `http://localhost:5000/api/space-history?date=MM-DD`
4. Events should load from the backend

### 🧪 Manual API Test

Test backend directly:
```bash
# Check if backend is healthy
curl http://localhost:5000/api/health

# Fetch space events for January 15
curl "http://localhost:5000/api/space-history?date=01-15"

# Check cache status
curl http://localhost:5000/api/space-history/cache/info
```

---

## 📊 How to Know It's Working

✅ Backend responds to health check  
✅ Frontend loads at http://localhost:3000  
✅ Selecting date triggers API request  
✅ Events display on the page  
✅ Browser console shows no CORS errors  
✅ Second request for same date shows `"cached": true`  

---

## 🚨 Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Port 5000 already in use | `PORT=5001 npm start` (in server folder) |
| CORS error in console | Check `server/.env` has correct `CORS_ORIGIN` |
| "Cannot find module" | Run `npm install` in root and `server/` folders |
| Events not loading | Check backend is running and health check passes |

---

## 📝 Environment Files Checklist

- [ ] Root `.env` has `REACT_APP_API_BASE_URL=http://localhost:5000`
- [ ] `server/.env` has `PORT=5000` and `CORS_ORIGIN=http://localhost:3000`
- [ ] Backend dependencies installed (`server/node_modules/` exists)
- [ ] Frontend dependencies installed (`node_modules/` exists)

---

**Next Step:** Read [FULLSTACK_SETUP.md](./FULLSTACK_SETUP.md) for complete documentation
