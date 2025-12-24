# 🧪 Feature 005: Complete Testing Guide

**Yeh guide aapko step-by-step batayegi ki kaise Feature 005 (Personalized Book Experience) ko test karein.**

---

## 📋 Pre-Requirements (Pehle Ye Check Karo)

### Backend Requirements:
```bash
cd backend
python --version  # Python 3.11+ hona chahiye
pip list | grep -E "fastapi|sqlalchemy|passlib|python-jose"
```

### Frontend Requirements:
```bash
cd frontend
npm --version  # v16+ hona chahiye
ls node_modules | grep -E "react|docusaurus"
```

### Environment Variables:
```bash
cd backend
cat .env  # Ye check karo ki sab variables set hain:
# - NEON_POSTGRES_URL
# - JWT_SECRET_KEY
# - OPENAI_API_KEY
# - QDRANT_HOST
```

---

## 🚀 Step 1: Backend Server Start Karo

### Terminal 1: Backend
```bash
cd backend
python main.py
```

**✅ Success Signs:**
- `INFO: Started server process`
- `INFO: Uvicorn running on http://0.0.0.0:8001`
- `Database initialized successfully` (agar database connected hai)
- Ya `Running in mock mode without database` (agar database nahi hai - ye bhi theek hai testing ke liye)

**❌ Agar Error Aaye:**
- `ModuleNotFoundError`: Run `pip install -r requirements.txt`
- `Address already in use`: Port 8001 already use ho raha hai, kill karo: `killall python` (Mac/Linux) ya Task Manager se close karo (Windows)

---

## 🌐 Step 2: Frontend Server Start Karo

### Terminal 2: Frontend (Separate Terminal)
```bash
cd frontend
npm start
```

**✅ Success Signs:**
- `Compiled successfully`
- `Local: http://localhost:3000`
- Browser automatically khul jayega

**❌ Agar Error Aaye:**
- `npm ERR!`: Run `npm install`
- Port 3000 busy hai: `PORT=3001 npm start` try karo

---

## 🧪 Step 3: Manual Testing (Bilkul Step-by-Step)

### Test 1: Navbar Mein Login/Signup Buttons Dikhen

1. Browser mein jaao: `http://localhost:3000`
2. **Check karo**: Top right corner mein ye buttons dikhen:
   - 🔐 Login
   - 🤖 Sign Up
   - GitHub

**✅ Pass**: Dono buttons dikh rahe hain
**❌ Fail**: Buttons nahi dikh rahe → Navbar config check karo `frontend/docusaurus.config.js`

---

### Test 2: Signup Page Open Ho

1. Click karo **"🤖 Sign Up"** button pe
2. **Check karo**: Signup form dikhe with fields:
   - Email
   - Password
   - Confirm Password
   - Software Background (textarea, min 10 chars)
   - Hardware Background (textarea, min 10 chars)
   - Experience Level (dropdown)
   - Sign Up button

**✅ Pass**: Form properly display ho raha hai
**❌ Fail**: Page 404 hai → Check karo `frontend/src/pages/signup.jsx` exist karta hai

---

### Test 3: Signup Form Validation

1. Signup form mein **kuch bhi na bharo**, direct submit karo
2. **Check karo**: Validation errors dikhen:
   - "Email is required"
   - "Password is required"
   - etc.

3. Ab **short password** dalo (6 characters):
   - Email: `test@example.com`
   - Password: `Test12`
   - **Expected**: "Password must be at least 8 characters"

4. Ab **short background** dalo (5 characters):
   - Software Background: `Python`
   - **Expected**: "Software background must be at least 10 characters"

**✅ Pass**: Saare validation messages properly dikhe
**❌ Fail**: Validation kaam nahi kar raha → SignupWithBackground.jsx check karo

---

### Test 4: Successful Signup

1. Form properly bharo:
   ```
   Email: test@example.com
   Password: SecurePass123!
   Confirm Password: SecurePass123!
   Software Background: Python developer with 5 years experience, familiar with FastAPI and React frameworks
   Hardware Background: Hobbyist with Arduino and Raspberry Pi projects, beginner in robotics and embedded systems
   Experience Level: Intermediate
   ```

2. Click **"Sign Up"** button

3. **Check Terminal 1 (Backend)**:
   - `POST /api/auth/signup 200 OK` dikhe
   - Ya `201 Created` status

4. **Check Browser**:
   - Alert popup: "✅ Signup successful! Welcome to Physical AI Textbook"
   - Automatic redirect to `/docs/intro`

5. **Check LocalStorage** (Browser DevTools → Application → Local Storage):
   - `user_token`: JWT token honi chahiye
   - `user_email`: test@example.com

**✅ Pass**: Signup successful, token stored, redirect ho gaya
**❌ Fail**:
   - 400 Error → Email already exists (different email try karo)
   - 500 Error → Backend logs check karo
   - No redirect → Check `signup.jsx` redirect logic

---

### Test 5: Login With Created Account

1. Click **"🔐 Login"** button navbar mein
2. Login form bharo:
   ```
   Email: test@example.com
   Password: SecurePass123!
   ```
3. Click **"🚀 Log In"**

4. **Check Terminal 1 (Backend)**:
   - `POST /api/auth/login 200 OK`

5. **Check Browser**:
   - Alert: "✅ Login successful! Welcome back"
   - Redirect to `/docs/intro`

**✅ Pass**: Login successful
**❌ Fail**:
   - 401 Error → Wrong password ya email not found
   - Backend logs check karo

---

### Test 6: Personalize Button Dikhe (Most Important!)

1. Koi bhi chapter kholo (e.g., `/docs/intro` ya `/docs/ros2-fundamentals`)

2. **Check karo PAGE KE TOP PE** (title ke neeche):
   - Beautiful gradient box dikhe with:
     - **"✨ Personalize for My Background"** button
     - User ka software/hardware background info dikhe
     - Example:
       ```
       💻 Python developer with 5 years experience...
       🔧 Hobbyist with Arduino and Raspberry Pi projects...
       ```

**✅ Pass**: Button visible hai with user info
**❌ Fail**: Button nahi dikh raha → 2 reasons ho sakte hain:

#### Debug Step A: Check Chapter Has `chapter_id`
```bash
# Check frontmatter
head -10 frontend/docs/intro.md
```
**Expected**:
```markdown
---
sidebar_position: 1
chapter_id: "ch00-introduction"
---
```

#### Debug Step B: Check Browser Console
- Press F12 → Console tab
- Koi error dikhe? (red text)
- Screenshot lo aur error message dekho

#### Debug Step C: Check Token Stored Hai
- Press F12 → Application tab → Local Storage
- `user_token` exist karta hai?
- Agar nahi → Logout karke dobara login karo

---

### Test 7: Click Personalize Button

1. **"✨ Personalize for My Background"** button click karo

2. **Loading State Check Karo**:
   - Button text change ho: **"⏳ Processing..."**
   - Button disabled ho jaye (click nahi hoga)

3. **Wait Karo 5-10 seconds** (AI generate kar raha hai)

4. **Check Terminal 1 (Backend)**:
   - `POST /api/personalization/adapt 200 OK`

5. **Check Browser**:
   - Beautiful blue box dikhe with:
     - **"🎯 Your Personalized Learning Roadmap"** heading
     - Personalized content based on your background
     - Example:
       ```
       Given your Python development background and Arduino experience,
       here's your learning path for this chapter...

       ## Prerequisites You Already Have:
       - Python programming fundamentals
       - Basic hardware interaction (Arduino)

       ## What You'll Learn:
       ...
       ```

6. **"🔄 Reset to Original"** button dikhe
   - Click karo → Personalized content hide ho jaye

**✅ Pass**: Personalization successfully generate ho gaya aur display ho raha hai
**❌ Fail**:
   - Infinite loading → Backend mein error hai, Terminal 1 check karo
   - Error message → OpenRouter API key valid hai? `.env` check karo
   - No content shown → Browser console check karo

---

### Test 8: Cached Personalization (Future - Database Required)

1. Same chapter dobara visit karo (refresh ya navigate away and come back)
2. **Expected**: Personalization instantly display ho (regenerate nahi hoga)

**Note**: Ye feature tabhi kaam karega jab database caching logic implement ho.

---

## 🔧 Common Issues & Solutions

### Issue 1: "Failed to fetch" Error
**Problem**: Backend nahi chal raha
**Solution**:
```bash
cd backend
python main.py
```

### Issue 2: PersonalizeButton Nahi Dikh Raha
**Check Karo**:
1. User logged in hai? (LocalStorage mein `user_token` hai?)
2. Chapter mein `chapter_id` hai? (`docs/*.md` frontmatter check karo)
3. Browser console mein error hai?

**Quick Fix**:
```bash
# Logout karo
localStorage.clear()

# Dobara login karo
Go to /signup → Create account → Login
```

### Issue 3: Backend 500 Error
**Check Karo Terminal 1 (Backend logs)**:
- Database connection error? → Mock mode mein chal jayega
- OpenRouter API error? → API key valid hai?
- Module not found? → `pip install -r requirements.txt`

### Issue 4: Frontend Build Errors
```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

---

## 📸 Expected Screenshots

### 1. Navbar with Login/Signup
```
[Physical AI Textbook] [Physical AI] [Humanoid Robotics]     [🔐 Login] [🤖 Sign Up] [GitHub]
```

### 2. Signup Form
```
🤖 Create Your Account

Email: [____________]
Password: [____________]
Confirm Password: [____________]
Software Background: [____________________]
                      (min 10 characters)
Hardware Background: [____________________]
                      (min 10 characters)
Experience Level: [Intermediate ▼]

[🚀 Sign Up]

Already have an account? Log In
```

### 3. PersonalizeButton on Chapter
```
┌─────────────────────────────────────────────────┐
│ ✨ Personalize for My Background     🔄 Reset   │
│ 💻 Python developer with 5 years experience...  │
│ 🔧 Arduino hobbyist, beginner in robotics       │
└─────────────────────────────────────────────────┘

# Introduction to Physical AI

Welcome to the AI-native interactive textbook...
```

### 4. Personalized Roadmap
```
┌───────────────────────────────────────────────────┐
│ 🎯 Your Personalized Learning Roadmap            │
│                                                   │
│ Given your Python background and Arduino         │
│ experience, here's your tailored learning path:  │
│                                                   │
│ ## Prerequisites You Already Have:               │
│ - Python programming fundamentals                │
│ - Basic hardware interaction (Arduino)           │
│ ...                                              │
└───────────────────────────────────────────────────┘
```

---

## ✅ Final Checklist

### Backend Tests:
- [ ] Backend starts without errors
- [ ] Database initialization logs show (ya mock mode message)
- [ ] `/api/auth/signup` endpoint works (POST)
- [ ] `/api/auth/login` endpoint works (POST)
- [ ] `/api/auth/profile` endpoint works (GET with token)
- [ ] `/api/personalization/adapt` endpoint works (POST with token)

### Frontend Tests:
- [ ] Frontend starts without errors
- [ ] Navbar shows Login/Signup buttons
- [ ] `/signup` page loads properly
- [ ] `/login` page loads properly
- [ ] Signup form validation works
- [ ] Successful signup stores token and redirects
- [ ] Login works and stores token
- [ ] PersonalizeButton appears on chapters with `chapter_id`
- [ ] PersonalizeButton shows user background info
- [ ] Clicking button generates personalized content
- [ ] Personalized roadmap displays properly
- [ ] Reset button hides personalization

### Integration Tests:
- [ ] Complete flow: Signup → Login → Navigate to chapter → Personalize → View roadmap
- [ ] Token persists across page refreshes
- [ ] Logout clears token (if implemented)

---

## 🎯 Success Criteria

**Feature 005 is working perfectly when:**

1. ✅ User can signup with email + password + backgrounds
2. ✅ User can login and get JWT token
3. ✅ PersonalizeButton visible on chapters
4. ✅ Clicking button generates personalized learning roadmap
5. ✅ Roadmap is relevant to user's software/hardware background
6. ✅ UI is beautiful with gradient backgrounds and animations

---

## 📞 Need Help?

**Agar koi issue aa raha hai:**

1. **Backend logs dekho**: Terminal 1 mein errors?
2. **Frontend console dekho**: Browser DevTools (F12) → Console tab
3. **Network tab dekho**: Browser DevTools → Network tab → API calls succeed kar rahe hain?
4. **LocalStorage dekho**: Browser DevTools → Application → Local Storage → `user_token` hai?

**Common Error Messages:**

- `"Failed to fetch"` → Backend nahi chal raha
- `"401 Unauthorized"` → Token invalid ya expired
- `"400 Bad Request"` → Validation error, form data check karo
- `"500 Internal Server Error"` → Backend crash, logs check karo

---

**Happy Testing! 🎉**

Agar sab tests pass ho gaye, to feature fully working hai! 🚀
