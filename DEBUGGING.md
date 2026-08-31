# 🔧 Stellar.log Debugging Guide

## ❌ Issues Reported

1. **Wikipedia API not opening** - Backend fetch failing
2. **Game canvas blank** - Canvas not rendering
3. **Search bar dull** - UI styling issue
4. **Calendar not updating** - Date picker not triggering events fetch

---

## ✅ Fixes Applied

### 1. **Search Bar & Toggle Button Styling** ✅
**File:** `src/components/ContentSection.css`
- Enhanced toggle button with gradient background
- Added glow effect on hover
- Added vibrant search input styling
- Better color contrast (cyan/blue theme)

### 2. **Game Canvas Initialization** ✅
**File:** `src/components/AsteroidDeflector.jsx`
- Improved canvas sizing with fallback retry logic
- Better error logging for debugging
- Canvas background cleared on init
- Console logs showing exact dimensions

### 3. **API Debugging & Calendar Fix**
**File:** `src/components/ContentSection.js`
- Already has event fetching on `selectedDate` change
- DatePicker properly connected to `setSelectedDate`

---

## 🔍 Diagnostic Checklist

### **Backend (Port 5000)**

#### Step 1: Verify Backend is Running
```bash
cd server
npm install
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

#### Step 2: Test Backend Endpoint Directly
Open in your browser or use curl:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test space history (January 15)
curl "http://localhost:5000/api/space-history?date=01-15"
```

**Expected Response:**
```json
{
  "data": {
    "month": 1,
    "day": 15,
    "totalEvents": 150,
    "spaceEventsCount": 8,
    "events": [...]
  },
  "cached": false,
  "timestamp": "2026-06-22T...",
  "message": "Data fetched from Wikipedia and cached"
}
```

**If error occurs, check:**
- Network connection (Wikipedia API might be slow)
- Wikipedia API status: https://status.wikimedia.org/
- CORS headers in response

---

### **Frontend (Port 3000)**

#### Step 3: Verify Frontend Environment Variables
**File:** `.env` in root
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

#### Step 4: Check Browser Console for Errors
When you pick a date:
1. Open **DevTools** (F12)
2. Go to **Console** tab
3. You should see:
   ```
   📡 Fetching events for 1/15...
   ✅ Backend response: {...}
   📊 Total events received: 8
   ```

If you see errors like:
```
❌ Failed to fetch historical events for 1/15: fetch failed
```

This means:
- Backend is not running
- CORS is blocked
- Network request failed

---

## 🎮 Game Canvas Debugging

### Step 5: Test Game Canvas Initialization

1. Click **⏱️ GAME** button
2. Check browser console for:
   ```
   📐 Container dimensions: 800x600
   ✅ Canvas initialized successfully: 800x600
   🎮 Starting game loop...
   ```

3. If you see blank canvas but console shows "✅ Canvas initialized":
   - Canvas is properly sized
   - Game loop is running
   - You should see grid + starfield immediately

4. If canvas is still blank:
   - Check: `ctx.fillStyle = 'rgba(5, 10, 30, 1); ctx.fillRect(0, 0, width, height);` is working
   - Verify: `requestAnimationFrame` is called
   - Ensure: Canvas element has correct dimensions

---

## 📋 Complete Startup Sequence

### **Terminal 1 - Backend**
```bash
cd server
npm start
# Wait for: ✅ Stellar.log Backend Server running on port 5000
```

### **Terminal 2 - Frontend**
```bash
npm start
# React should open localhost:3000
```

### **Browser Console (DevTools)**
1. Navigate to http://localhost:3000
2. F12 → Console tab
3. Pick a date in calendar
4. You should see fetch logs
5. Click **⏱️ GAME** button
6. You should see canvas init logs

---

## 🚨 Common Issues & Solutions

### **Issue: "Failed to fetch historical events"**
**Cause:** Backend not running
**Solution:**
```bash
cd server
npm start
# Verify port 5000 is open
lsof -i :5000
```

### **Issue: Blank Canvas in Game**
**Cause:** Canvas context not bound properly
**Check:**
- Container has non-zero dimensions
- Canvas.getContext('2d') returns valid context
- `requestAnimationFrame` is being called

**Verify in Console:**
```javascript
// In DevTools console
const canvas = document.querySelector('.game-canvas');
console.log('Canvas:', canvas);
console.log('Canvas size:', canvas.width, 'x', canvas.height);
console.log('Context:', canvas.getContext('2d'));
```

### **Issue: Calendar not updating**
**Cause:** DatePicker not connected to state
**Check:** In ContentSection.js
- `onChange={(date) => setSelectedDate(date)}` exists
- `useEffect` has `[selectedDate]` dependency

### **Issue: Search bar not visible**
**Solution:** CSS not loaded
**Check:**
- ContentSection.css is imported in ContentSection.js
- Line 5 has import statement
- CSS has `.search-toggle input[type="text"]` selector

---

## 🧪 Manual Test Procedures

### Test 1: API Response Time
```bash
time curl "http://localhost:5000/api/space-history?date=01-15"
```
Should respond in < 100ms on cache hit, < 1000ms on cache miss

### Test 2: Calendar Date Change
1. Calendar shows "Pick a date:"
2. Click on calendar → pick new date
3. Events should load below calendar

### Test 3: Game Canvas Rendering
1. Click ⏱️ GAME button
2. See "START MISSION" button
3. Click button
4. Should see:
   - Grid background (cyan lines)
   - Twinkling stars
   - Earth at bottom with glow
   - Asteroids falling

### Test 4: Game Interaction
1. Start game
2. Try clicking asteroids
3. Should see:
   - Explosion particles
   - Score increases
   - Sound plays (if audio enabled)

---

## 📊 Performance Metrics

| Component | Expected Time | Acceptable | Problem |
|-----------|---|---|---|
| Backend health | < 50ms | < 100ms | Slow network |
| Wikipedia fetch | 500-1500ms | < 3000ms | API timeout |
| Canvas render | 16ms (60fps) | < 33ms | GPU issue |
| Calendar date change | < 100ms | < 500ms | Slow filter |

---

## 🔗 Resources

- **Wikipedia API Docs:** https://en.wikipedia.org/api/rest_v1/
- **Canvas API Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **React DatePicker:** https://reactdatepicker.com/

---

## ✨ Next Steps

1. **Verify Backend Running:** `curl http://localhost:5000/api/health`
2. **Check Browser Console:** Pick a date and watch logs
3. **Test Game Canvas:** Click ⏱️ GAME button
4. **Report Errors:** Share console errors if any appear

Good luck! 🚀
