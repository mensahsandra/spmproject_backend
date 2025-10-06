# 🚀 Deploying Quiz Management to Vercel

## 🔍 Current Issue

Your frontend is calling the deployed Vercel backend (`https://spmproject-backend.vercel.app`) but the quiz routes haven't been deployed yet. The local backend has the quiz functionality, but Vercel doesn't.

## 📋 Deployment Steps

### Step 1: Verify Local Setup
```bash
# Make sure everything works locally first
npm start

# Test the endpoints
curl http://localhost:3000/api/quizzes/test
curl http://localhost:3000/api/health
```

### Step 2: Deploy to Vercel
```bash
# If you have Vercel CLI installed:
vercel --prod

# Or push to your connected Git repository
git add .
git commit -m "Add quiz management functionality"
git push origin main
```

### Step 3: Verify Deployment
After deployment, test these URLs:
- `https://spmproject-backend.vercel.app/api/health`
- `https://spmproject-backend.vercel.app/api/quizzes/test`
- `https://spmproject-backend.vercel.app/api/auth/me` (with auth token)

## 🔧 Quick Fix for Testing

### Option 1: Test Locally
Change your frontend to use local backend temporarily:
```javascript
// In your frontend config
const API_BASE = 'http://localhost:3000/api';
```

### Option 2: Use Deployed Backend
Wait for deployment to complete, then test:
```javascript
// Your current setup (should work after deployment)
const API_BASE = 'https://spmproject-backend.vercel.app/api';
```

## 🧪 Test Deployment

After deploying, test these endpoints:

### 1. Health Check
```bash
curl https://spmproject-backend.vercel.app/api/health
```

### 2. Quiz Routes
```bash
curl https://spmproject-backend.vercel.app/api/quizzes/test
```

### 3. Auth Me (with token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://spmproject-backend.vercel.app/api/auth/me
```

### 4. Quiz Creation (with token)
```bash
curl -X POST https://spmproject-backend.vercel.app/api/quizzes/create-minimal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Quiz","courseCode":"BIT364"}'
```

## 📁 Files to Deploy

Make sure these files are included in your deployment:
- ✅ `routes/quizzes.js` - Quiz routes
- ✅ `models/Quiz.js` - Quiz model
- ✅ `models/QuizSubmission.js` - Submission model
- ✅ `app.js` - Updated with quiz routes
- ✅ `uploads/quizzes/` - Directory for file uploads

## 🔍 Troubleshooting Deployment

### If quiz routes still don't work after deployment:

1. **Check Vercel logs:**
   - Go to Vercel dashboard
   - Check function logs for errors

2. **Verify file structure:**
   - Make sure all files are committed to Git
   - Check that `app.js` includes the quiz routes

3. **Test step by step:**
   ```bash
   # Test basic health
   curl https://spmproject-backend.vercel.app/api/health
   
   # Test quiz health
   curl https://spmproject-backend.vercel.app/api/quizzes/health
   
   # Test with auth
   curl -H "Authorization: Bearer TOKEN" \
        https://spmproject-backend.vercel.app/api/auth/me
   ```

## 🎯 Expected Results

After successful deployment:
- ✅ Health endpoint works
- ✅ Quiz test endpoint works
- ✅ Auth me endpoint works with token
- ✅ Quiz creation works with token
- ✅ Frontend can create quizzes successfully

## 🚨 Common Issues

### Issue: "Route not found" for quiz endpoints
**Solution:** Quiz routes not deployed. Redeploy with all files.

### Issue: "Unexpected end of JSON input"
**Solution:** Server error or CORS issue. Check Vercel logs.

### Issue: Authentication fails
**Solution:** JWT secret not set in Vercel environment variables.

## 📞 Next Steps

1. **Deploy the code** to Vercel
2. **Test the endpoints** using the URLs above
3. **Update frontend** if needed to use correct endpoints
4. **Verify quiz creation** works end-to-end

Once deployed, your quiz management system will work perfectly! 🎉