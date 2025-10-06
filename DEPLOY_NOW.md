# 🚀 Deploy Quiz Management to Vercel - Step by Step

## ✅ Pre-Deployment Checklist

### Files Ready for Deployment:
- ✅ `routes/quizzes.js` - Quiz management routes
- ✅ `models/Quiz.js` - Quiz data model  
- ✅ `models/QuizSubmission.js` - Submission model
- ✅ `app.js` - Updated with quiz routes registration
- ✅ `routes/grades.js` - Enhanced with bulk grading
- ✅ All dependencies in package.json

## 🚀 Deployment Steps

### Step 1: Commit Your Changes
```bash
# Add all files
git add .

# Commit with descriptive message
git commit -m "feat: Add comprehensive quiz management system

- Add quiz creation with file uploads
- Add bulk grading functionality  
- Add student notification system
- Add quiz submission tracking
- Add enhanced API endpoints
- Add comprehensive error handling"

# Push to main branch (triggers Vercel deployment)
git push origin main
```

### Step 2: Monitor Deployment
- Go to your Vercel dashboard
- Watch the deployment progress
- Check for any build errors

### Step 3: Test Deployed Endpoints

#### Basic Health Check
```bash
curl https://spmproject-backend.vercel.app/api/health
```
**Expected:** JSON response with server status

#### Quiz Routes Test
```bash
curl https://spmproject-backend.vercel.app/api/quizzes/test
```
**Expected:** 
```json
{
  "ok": true,
  "message": "Quiz routes are working!",
  "timestamp": "2025-01-06T..."
}
```

#### Quiz Health Check
```bash
curl https://spmproject-backend.vercel.app/api/quizzes/health
```
**Expected:** List of available quiz endpoints

#### Minimal Quiz Creation (No Auth)
```bash
curl -X POST https://spmproject-backend.vercel.app/api/quizzes/create-minimal \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "courseCode": "BIT364",
    "description": "Deployment test"
  }'
```
**Expected:**
```json
{
  "ok": true,
  "success": true,
  "message": "Minimal quiz creation successful!",
  "data": { ... }
}
```

## 🧪 Frontend Testing After Deployment

### Test in Browser Console
```javascript
// Test quiz routes
fetch('https://spmproject-backend.vercel.app/api/quizzes/test')
  .then(r => r.json())
  .then(d => console.log('✅ Quiz routes:', d))
  .catch(e => console.error('❌ Error:', e));

// Test minimal quiz creation
fetch('https://spmproject-backend.vercel.app/api/quizzes/create-minimal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Browser Test Quiz',
    courseCode: 'BIT364'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Quiz creation:', d))
.catch(e => console.error('❌ Error:', e));
```

## 🔧 If Deployment Fails

### Common Issues & Solutions:

#### Issue: Build fails due to missing dependencies
**Solution:** Check package.json includes all required packages
```bash
npm install multer mongoose express-validator
```

#### Issue: Routes not found after deployment
**Solution:** Verify app.js includes quiz routes:
```javascript
app.use("/api/quizzes", require("./routes/quizzes"));
```

#### Issue: File upload errors on Vercel
**Solution:** Vercel has limitations on file uploads. For production, use cloud storage (AWS S3, Cloudinary, etc.)

## 🎯 Success Indicators

After successful deployment, you should see:
- ✅ Health endpoint responds
- ✅ Quiz test endpoint responds  
- ✅ Quiz creation works (minimal version)
- ✅ Frontend can call deployed endpoints
- ✅ No CORS errors in browser console

## 🔄 Next Steps After Deployment

1. **Test your frontend** - Try creating a quiz
2. **Check for errors** - Monitor browser console and network tab
3. **Test with authentication** - Use real lecturer login
4. **Verify file uploads** - Test with actual files
5. **Test bulk grading** - Try the bulk assign endpoint

## 📞 Troubleshooting Commands

If something doesn't work:

```bash
# Check deployment logs in Vercel dashboard
# Or test specific endpoints:

# Test auth (replace TOKEN with real token)
curl -H "Authorization: Bearer TOKEN" \
     https://spmproject-backend.vercel.app/api/auth/me

# Test quiz creation with auth
curl -X POST https://spmproject-backend.vercel.app/api/quizzes/create \
  -H "Authorization: Bearer TOKEN" \
  -F "title=Auth Test Quiz" \
  -F "courseCode=BIT364"

# Test bulk grading
curl -X POST https://spmproject-backend.vercel.app/api/grades/bulk-assign \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "BIT364",
    "assessmentType": "Quiz 1", 
    "score": 85,
    "studentFilter": "all"
  }'
```

## 🎉 Ready to Deploy!

Run these commands now:
```bash
git add .
git commit -m "feat: Add quiz management system"
git push origin main
```

Then test the endpoints above! 🚀