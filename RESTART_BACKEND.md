# 🔄 Backend Restart Karne Ka Tareeqa

## CORS Fix Apply Karne Ke Liye Backend Restart Zaruri Hai!

---

## Windows Par:

### Method 1: Simple Restart (Agar Terminal Open Hai)

1. **Backend terminal mein jaao** (jahan `python main.py` chal raha hai)
2. Press **`Ctrl + C`** (Stop server)
3. Wait for "Shutting down" message
4. Dobara run karo:
   ```bash
   python main.py
   ```

**Expected Output**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
Database initialized successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

---

### Method 2: Task Manager Se Force Stop (Agar Terminal Band Ho Gaya)

1. Press **`Ctrl + Shift + Esc`** (Open Task Manager)
2. **"Details"** tab pe jaao
3. **"python.exe"** search karo
4. Right-click → **"End Task"**
5. Terminal kholo aur backend start karo:
   ```bash
   cd E:\hakaton 1\AI-native-textbook\backend
   python main.py
   ```

---

### Method 3: Command Line Se Kill (Advanced)

```bash
# Find Python process
tasklist | findstr python

# Kill by PID (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Or kill all Python processes (careful!)
taskkill /IM python.exe /F

# Start backend again
cd backend
python main.py
```

---

## Mac/Linux Par:

### Method 1: Simple Restart
```bash
# Backend terminal mein
# Press Ctrl+C to stop

# Then restart
python main.py
```

### Method 2: Find and Kill Process
```bash
# Find process on port 8001
lsof -i :8001

# Kill by PID
kill -9 <PID>

# Or kill all Python processes
pkill -9 python

# Restart backend
cd backend
python main.py
```

---

## ✅ Verification (Backend Chal Raha Hai Ya Nahi)

### Test 1: Health Check
```bash
curl http://localhost:8001/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Test 2: Browser Se Check
Open browser: `http://localhost:8001/health`

**Expected**: JSON response dikhe

### Test 3: Check Logs
Terminal mein yeh messages dikhen:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8001
```

---

## 🔥 Common Issues & Solutions

### Issue 1: "Address already in use"
**Matlab**: Port 8001 already used hai, process kill nahi hua

**Solution**:
```bash
# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8001
kill -9 <PID>
```

### Issue 2: "ModuleNotFoundError"
**Matlab**: Dependencies install nahi hain

**Solution**:
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Issue 3: Backend Start Nahi Ho Raha
**Check**:
```bash
# Python version check
python --version  # Should be 3.11+

# Check if in correct directory
pwd  # Should end with /backend

# Try with full path
cd E:\hakaton 1\AI-native-textbook\backend
python main.py
```

---

## 🧪 Test CORS Fix After Restart

### Step 1: Backend Confirm
```bash
# Terminal mein yeh dikhe:
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Step 2: Frontend Test
1. Browser: `http://localhost:3000/login`
2. Open DevTools: **F12**
3. **Console** tab check karo
4. Login form submit karo
5. **Expected**: No CORS error

### Step 3: Network Tab Check (F12 → Network)
1. Submit login form
2. Click on `/api/auth/login` request
3. **Headers** tab mein dekho:

**Response Headers** (Ab yeh hona chahiye):
```
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
```

---

## 📝 Quick Reference

### Start Backend:
```bash
cd backend
python main.py
```

### Stop Backend:
- **Ctrl + C** in terminal
- OR Task Manager → End python.exe

### Check Backend:
```bash
curl http://localhost:8001/health
```

### Check Logs:
Terminal mein errors dikhen?

---

## 🎯 Success Checklist

- [ ] Backend successfully restarted
- [ ] `INFO: Uvicorn running on http://0.0.0.0:8001` dikha
- [ ] No error messages in terminal
- [ ] `curl http://localhost:8001/health` works
- [ ] Browser console: No CORS errors
- [ ] Login/Signup forms work properly

---

**✅ Backend Restart Ho Gaya! Ab Login/Signup Test Karo!**
