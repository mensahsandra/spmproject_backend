# 🔧 Troubleshooting "Unexpected end of JSON input" Error

## 🚨 Quick Diagnosis Steps

### Step 1: Check if Server is Running
```bash
# In your backend directory, run:
npm start

# You should see:
# ✅ Server running on port 3000
# Health check available at: http://localhost:3000/api/health
```

### Step 2: Test Server Health
```bash
# Run the diagnostic script:
node diagnose-issue.js

# Or manually test:
curl http://localhost:3000/api/health
```

### Step 3: Test Quiz Endpoints
```bash
# Test basic quiz route:
curl http://localhost:3000/api/quizzes/test

# Test minimal quiz creation:
curl -X POST http://localhost:3000/api/quizzes/create-minimal \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","courseCode":"BIT364"}'
```

### Step 4: Frontend Testing
Open `test-frontend.html` in your browser and run the tests.

## 🔍 Common Causes & Solutions

### 1. Server Not Running
**Symptoms:** Connection refused, no response
**Solution:**
```bash
cd backend
npm start
```

### 2. Wrong Port
**Symptoms:** Connection refused on port 3000
**Check:** Your server might be running on a different port
```bash
# Check what's running on port 3000
netstat -an | findstr :3000
```

### 3. CORS Issues
**Symptoms:** CORS error in browser console
**Solution:** Already configured in app.js, but check browser network tab

### 4. Route Not Registered
**Symptoms:** 404 Not Found
**Check:** Make sure quiz routes are registered in app.js
```javascript
app.use("/api/quizzes", require("./routes/quizzes"));
```

### 5. Authentication Issues
**Symptoms:** 401 Unauthorized
**Solution:** Use the test endpoints first (no auth required)

### 6. Database Connection Issues
**Symptoms:** Server starts but endpoints fail
**Check:** Server logs for MongoDB connection errors

## 🧪 Testing Endpoints

### Test 1: Basic Health Check
```bash
curl http://localhost:3000/api/health
```
**Expected:** JSON response with server status

### Test 2: Quiz Routes
```bash
curl http://localhost:3000/api/quizzes/test
```
**Expected:** JSON response confirming quiz routes work

### Test 3: Minimal Quiz Creation
```bash
curl -X POST http://localhost:3000/api/quizzes/create-minimal \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Quiz","courseCode":"BIT364"}'
```
**Expected:** Success response with quiz data

### Test 4: Form Data Quiz Creation
```bash
curl -X POST http://localhost:3000/api/quizzes/create-simple \
  -F "title=Test Quiz" \
  -F "courseCode=BIT364"
```
**Expected:** Success response

## 🌐 Frontend Debugging

### Check Browser Network Tab
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try creating a quiz
4. Look for the request to `/api/quizzes/create`
5. Check:
   - Request URL
   - Request method (should be POST)
   - Request headers
   - Request payload
   - Response status
   - Response body

### Common Frontend Issues

#### Issue: Request URL is wrong
**Check:** Make sure frontend is calling the correct endpoint
```javascript
// Should be:
fetch('/api/quizzes/create', { ... })
// Not:
fetch('/quizzes/create', { ... })
```

#### Issue: Missing Content-Type header
**Fix:** For FormData, don't set Content-Type (browser sets it automatically)
```javascript
// Correct for FormData:
fetch('/api/quizzes/create', {
  method: 'POST',
  body: formData  // Don't set Content-Type header
});
```

#### Issue: Authentication token missing
**Fix:** Add Authorization header
```javascript
fetch('/api/quizzes/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 🔧 Quick Fixes

### Fix 1: Use Test Endpoint First
Change your frontend to use the test endpoint temporarily:
```javascript
// Change from:
fetch('/api/quizzes/create', { ... })
// To:
fetch('/api/quizzes/create-minimal', { ... })
```

### Fix 2: Add Error Handling
```javascript
fetch('/api/quizzes/create', {
  method: 'POST',
  body: formData
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
})
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Detailed error:', error);
});
```

### Fix 3: Check Server Logs
Look at your server console for:
- Incoming requests
- Error messages
- Database connection status

## 📞 Still Having Issues?

1. **Run the diagnostic script:** `node diagnose-issue.js`
2. **Check server logs** for any error messages
3. **Test with the HTML file:** Open `test-frontend.html`
4. **Check browser network tab** for actual request/response
5. **Try the minimal endpoints** first before the full ones

## 🎯 Expected Working Flow

1. ✅ Server starts on port 3000
2. ✅ Health check responds with JSON
3. ✅ Quiz test endpoint responds with JSON
4. ✅ Minimal quiz creation works
5. ✅ Full quiz creation works
6. ✅ Frontend can create quizzes successfully

If any step fails, that's where the issue is!