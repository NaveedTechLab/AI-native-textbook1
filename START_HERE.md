# 🚀 QUICK START - Backend Aur Frontend Chalayen

**YEH FILE SABSE PEHLE PADHO!**

---

## ⚠️ IMPORTANT: Backend Chal Raha Hai Ya Nahi?

Aapka error (`404 Not Found`) iska matlab hai ki **backend server chal hi nahi raha hai!**

---

## ✅ SOLUTION: Backend Start Karo (2 Steps)

### Step 1: Backend Start Karo

#### Terminal 1 Open Karo:
```bash
cd E:\hakaton 1\AI-native-textbook\backend
python main.py
```

**Wait for these messages:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
Database initialized successfully
(OR: Running in mock mode without database)
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**⚠️ Agar Error Aaye:**

**Error 1: "ModuleNotFoundError"**
```bash
pip install -r requirements.txt
python main.py
```

**Error 2: "Address already in use"**
```bash
# Windows:
taskkill /IM python.exe /F

# Mac/Linux:
pkill python

# Then try again:
python main.py
```

**Error 3: "Python not found"**
```bash
# Check Python installed hai:
python --version

# Ya try:
py main.py
python3 main.py
```

---

### Step 2: Verify Backend Started

Open new terminal (ya browser):
```bash
curl http://localhost:8001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Ya browser mein jaao:** `http://localhost:8001/health`

---

## ✅ Frontend Already Running (No Action Needed)

Frontend already chal raha hai `localhost:3000` pe. Sirf backend ki zarurat thi!

---

## 🧪 Ab Test Karo

### Test 1: Signup
1. Browser: `http://localhost:3000/signup`
2. Form bharo (min 10 chars for backgrounds)
3. Submit
4. **Expected**: ✅ "Signup successful!" alert

### Test 2: Login
1. Browser: `http://localhost:3000/login`
2. Credentials dalo
3. Submit
4. **Expected**: ✅ "Login successful!" alert

### Test 3: PersonalizeButton
1. Navigate to: `http://localhost:3000/docs/intro`
2. **Expected**: Gradient box dikhe with "Personalize" button
3. Click button
4. **Expected**: AI roadmap generate ho

---

## 📋 Detailed Startup Checklist

### Backend Startup:
- [ ] Terminal open kiya
- [ ] `cd backend` kiya
- [ ] `python main.py` run kiya
- [ ] "Uvicorn running on http://0.0.0.0:8001" dikha
- [ ] No error messages
- [ ] `curl http://localhost:8001/health` works

### Frontend Startup (Already Done):
- [ ] Frontend running on `http://localhost:3000`
- [ ] Navbar has Login/Signup buttons
- [ ] Pages load properly

### Testing:
- [ ] Backend responding to requests
- [ ] No CORS errors in console
- [ ] Login/Signup work
- [ ] PersonalizeButton shows on chapters

---

## 🎯 Quick Commands Reference

### Start Backend:
```bash
cd backend
python main.py
```

### Stop Backend:
Press `Ctrl+C` in backend terminal

### Check Backend Status:
```bash
curl http://localhost:8001/health
```

### View Backend Logs:
Backend terminal mein errors/logs dikhengi

---

## 🔥 Common Errors & Solutions

### Error: "404 Not Found"
**Problem**: Backend not running
**Solution**:
```bash
cd backend
python main.py
```

### Error: "CORS policy"
**Problem**: Backend running but CORS not configured
**Solution**: Already fixed! Just restart backend:
```bash
# Stop with Ctrl+C, then:
python main.py
```

### Error: "Failed to fetch"
**Problem**: Backend crashed or not started
**Solution**: Check backend terminal for errors, restart if needed

### Error: "Connection refused"
**Problem**: Backend port 8001 blocked or not started
**Solution**:
```bash
# Check if something on port 8001:
netstat -ano | findstr :8001

# Kill it:
taskkill /PID <PID> /F

# Start backend again
```

---

## 🎨 Visual Guide

### Expected Terminal Layout:

**Terminal 1 (Backend):**
```
E:\hakaton 1\AI-native-textbook\backend> python main.py
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
Database initialized successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

**Terminal 2 (Frontend) - Already Running:**
```
E:\hakaton 1\AI-native-textbook\frontend> npm start
Compiled successfully!
Local:            http://localhost:3000
```

### Browser Console (F12):

**Before Backend Starts:**
```
❌ POST http://localhost:8001/api/auth/signup net::ERR_FAILED
❌ Signup error: TypeError: Failed to fetch
```

**After Backend Starts:**
```
✅ POST http://localhost:8001/api/auth/signup 200 OK
✅ Response: {user_id: "...", access_token: "..."}
```

---

## 📂 File Organization

```
AI-native-textbook/
├── backend/              ← YOU ARE HERE (need to start this!)
│   ├── main.py          ← Entry point
│   ├── api/
│   │   ├── auth.py      ← Signup/Login endpoints
│   │   └── ...
│   └── requirements.txt
│
├── frontend/            ← Already running on port 3000
│   ├── src/
│   │   ├── pages/
│   │   │   ├── signup.jsx
│   │   │   └── login.jsx
│   │   └── ...
│   └── package.json
│
└── Documentation:
    ├── START_HERE.md         ← THIS FILE (read first!)
    ├── TESTING_GUIDE.md      ← Complete testing guide
    ├── RESTART_BACKEND.md    ← Backend restart help
    ├── CORS_FIX.md           ← CORS issue explanation
    └── FEATURE_005_FIXED.md  ← Feature summary
```

---

## 🎯 SUCCESS = Both Running

### ✅ Backend Running:
- Terminal shows "Uvicorn running on http://0.0.0.0:8001"
- `curl http://localhost:8001/health` returns JSON
- No errors in terminal

### ✅ Frontend Running:
- Browser shows `http://localhost:3000`
- Navbar has Login/Signup buttons
- No console errors (F12)

### ✅ Both Connected:
- Signup form submits successfully
- No "Failed to fetch" errors
- No CORS errors
- Login works and redirects

---

## 🆘 Still Having Issues?

### Step 1: Screenshot Backend Terminal
Backend terminal ki full screenshot lo (errors visible hon)

### Step 2: Screenshot Browser Console
F12 → Console tab → Full screenshot with errors

### Step 3: Check Ports
```bash
# Windows:
netstat -ano | findstr :8001
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :8001
lsof -i :3000
```

### Step 4: Python Version
```bash
python --version
# Should be 3.11 or higher
```

### Step 5: Dependencies
```bash
cd backend
pip list | grep -E "fastapi|uvicorn|sqlalchemy"
# Should show all packages installed
```

---

## 🎊 Once Both Are Running:

1. **Signup**: `http://localhost:3000/signup`
   - Create account with email + password + backgrounds

2. **Login**: `http://localhost:3000/login`
   - Login with your credentials

3. **Personalize**: `http://localhost:3000/docs/intro`
   - Click "Personalize for My Background" button
   - Wait 5-10 seconds
   - See AI-generated learning roadmap

---

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# DO THIS NOW:
cd backend
python main.py

# Wait for "Uvicorn running on http://0.0.0.0:8001"
# Then test: http://localhost:3000/signup
```

---

**🚀 Backend Start Karo, Sab Kaam Karega! 🎉**
