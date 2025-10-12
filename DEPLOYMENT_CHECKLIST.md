# 🚀 Deployment Checklist

## ✅ Backend Changes Completed

### Files Modified:
- [x] `routes/grades.js` - Added new endpoints and sample data
- [x] `routes/quizzes.js` - Added grade sync logging
- [x] `services/gradeService.js` - Created centralized grade service
- [x] `scripts/seedSampleStudents.js` - Created student seeding script

### New Endpoints Added:
- [x] `GET /api/grades/enrolled` - Get enrolled students with grades
- [x] `GET /api/grades/history` - Get grade history for a course
- [x] `POST /api/grades/assign` - Assign individual grades
- [x] `GET /api/grades/semesters` - Updated to return Block 1 & Block 2

### Sample Data:
- [x] 4 students created in database (John Kwaku Doe, Saaed Hawa, Kwarteng Samuel, Nashiru Alhassan)
- [x] Sample grades added for BIT364 course
- [x] All students enrolled in BIT364

---

## 📋 Deployment Steps

### 1. Backend Deployment to Vercel

#### Option A: Automatic Deployment (Recommended)
```bash
# Commit all changes
git add .
git commit -m "feat: Add grade management endpoints and sample students

- Add GET /api/grades/enrolled endpoint
- Add GET /api/grades/history endpoint  
- Add POST /api/grades/assign endpoint
- Update semester options to Block 1 and Block 2
- Create 4 sample students with grades
- Add centralized grade service
- Add student seeding script"

# Push to GitHub (triggers Vercel auto-deploy)
git push origin main
```

#### Option B: Manual Deployment
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### 2. Verify Deployment

```bash
# Test the health endpoint
curl https://spmproject-backend.vercel.app/api/grades/health

# Run the test suite
node test-grade-endpoints.js
```

### 3. Check Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Find your project: `spmproject-backend`
3. Check deployment status
4. View deployment logs for any errors
5. Verify environment variables are set:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_ORIGINS`

---

## 🔍 Post-Deployment Verification

### Backend Verification

Run these commands to verify endpoints:

```bash
# 1. Health check
curl https://spmproject-backend.vercel.app/api/grades/health

# 2. Login as lecturer (get token)
curl -X POST https://spmproject-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kwabena@knust.edu.gh","password":"password123!"}'

# 3. Test enrolled endpoint (replace TOKEN)
curl https://spmproject-backend.vercel.app/api/grades/enrolled?courseCode=BIT364 \
  -H "Authorization: Bearer TOKEN"

# 4. Test history endpoint (replace TOKEN)
curl https://spmproject-backend.vercel.app/api/grades/history?courseCode=BIT364 \
  -H "Authorization: Bearer TOKEN"

# 5. Test semesters endpoint (replace TOKEN)
curl https://spmproject-backend.vercel.app/api/grades/semesters \
  -H "Authorization: Bearer TOKEN"
```

### Database Verification

```bash
# Run the student seeding script (if not already done)
node scripts/seedSampleStudents.js
```

Expected output:
```
✅ Created: 4 students
📧 john.doe@student.edu / 🔑 Student123!
📧 saaed.hawa@student.edu / 🔑 Student123!
📧 kwarteng.samuel@student.edu / 🔑 Student123!
📧 nashiru.alhassan@student.edu / 🔑 Student123!
```

---

## 🎨 Frontend Integration Tasks

### 1. Update Lecturer Assessment Page

**File:** `frontend/src/pages/lecturer/Assessment.jsx` (or similar)

**Changes needed:**
```jsx
// Replace hardcoded data with API call
useEffect(() => {
  async function fetchStudents() {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/grades/enrolled?courseCode=${selectedCourse}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    setStudents(data.students);
  }
  fetchStudents();
}, [selectedCourse]);
```

**Expected result:**
- ✅ No more 404 errors
- ✅ Shows 4 sample students with grades
- ✅ Displays Assessment, Midsem, End of Semester columns

### 2. Update Student Results Page

**File:** `frontend/src/pages/student/DisplayResult.jsx` (or similar)

**Changes needed:**
```jsx
// Update semester dropdown
useEffect(() => {
  async function fetchSemesters() {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/grades/semesters`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    setSemesters(data.semesters); // Will be ["Block 1", "Block 2"]
  }
  fetchSemesters();
}, []);
```

**Expected result:**
- ✅ Dropdown shows "Block 1" and "Block 2" instead of "Semester 1, 2, 3"

### 3. Add Grade Assignment Feature (Optional)

**New component:** `frontend/src/components/GradeAssignmentForm.jsx`

```jsx
async function assignGrade(gradeData) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/grades/assign`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gradeData)
    }
  );
  return response.json();
}
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Health endpoint returns success
- [ ] Enrolled endpoint returns 4 students
- [ ] History endpoint returns grade records
- [ ] Assignment endpoint creates/updates grades
- [ ] Semesters endpoint returns Block 1 & Block 2
- [ ] Authentication works for all endpoints
- [ ] Error handling works (401, 404, 500)

### Frontend Tests
- [ ] Lecturer can view enrolled students
- [ ] Student grades display correctly
- [ ] No 404 errors in console
- [ ] Semester dropdown shows blocks
- [ ] Grade assignment form works
- [ ] Loading states display properly
- [ ] Error messages show when API fails

### Integration Tests
- [ ] Login as lecturer → View assessment page → See students
- [ ] Login as student → View results → See grades
- [ ] Assign grade → Refresh page → Grade persists
- [ ] Quiz submission → Grade appears in management

---

## 🐛 Troubleshooting

### Issue: Endpoints return 404

**Cause:** Backend not deployed with latest changes

**Solution:**
```bash
# Check deployment status
vercel ls

# Redeploy
git push origin main
# or
vercel --prod
```

### Issue: Empty student list

**Cause:** Students not seeded in database

**Solution:**
```bash
node scripts/seedSampleStudents.js
```

### Issue: 401 Unauthorized

**Cause:** Invalid or expired JWT token

**Solution:**
- Re-login to get fresh token
- Check token is being sent in Authorization header
- Verify JWT_SECRET matches between environments

### Issue: CORS errors

**Cause:** Frontend URL not in allowed origins

**Solution:**
1. Go to Vercel dashboard
2. Add frontend URL to `FRONTEND_ORIGINS` environment variable
3. Redeploy backend

### Issue: Grades not persisting

**Cause:** Using in-memory gradeStore (resets on deployment)

**Solution:**
- This is expected behavior with current implementation
- For persistence, migrate to database (see Future Improvements)

---

## 📊 Monitoring

### Check Deployment Logs

```bash
# View recent logs
vercel logs spmproject-backend

# Follow logs in real-time
vercel logs spmproject-backend --follow
```

### Monitor API Usage

1. Go to Vercel Dashboard
2. Select project
3. View Analytics tab
4. Check:
   - Request count
   - Error rate
   - Response times
   - Geographic distribution

---

## 🔮 Future Improvements

### Short-term (Next Sprint)
- [ ] Migrate gradeStore to MongoDB for persistence
- [ ] Add pagination to history endpoint
- [ ] Implement grade calculation (weighted average)
- [ ] Add bulk grade import (CSV)
- [ ] Add grade export functionality

### Medium-term
- [ ] Real-time grade updates (WebSocket)
- [ ] Grade analytics dashboard
- [ ] Email notifications for grade postings
- [ ] Grade dispute/appeal system
- [ ] Audit trail for grade changes

### Long-term
- [ ] Machine learning for grade predictions
- [ ] Integration with LMS systems
- [ ] Mobile app for grade viewing
- [ ] Advanced reporting and analytics

---

## 📞 Support Contacts

**Backend Issues:**
- Check Vercel logs
- Review error messages in browser console
- Test endpoints with curl or Postman

**Frontend Issues:**
- Check browser console for errors
- Verify API_URL in .env file
- Test with network tab open

**Database Issues:**
- Check MongoDB Atlas connection
- Verify DATABASE_URL in Vercel env vars
- Run seed scripts to populate data

---

## ✅ Final Checklist

Before marking as complete:

- [ ] All backend changes committed and pushed
- [ ] Backend deployed to Vercel successfully
- [ ] All endpoints tested and working
- [ ] Sample students created in database
- [ ] Frontend integration guide provided
- [ ] Test script created and documented
- [ ] Deployment verified in production
- [ ] No console errors on frontend
- [ ] All 404 errors resolved
- [ ] Documentation updated

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Version:** 2.0.0
**Status:** ⏳ Pending Deployment

---

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ `GET /api/grades/enrolled?courseCode=BIT364` returns 4 students
2. ✅ `GET /api/grades/history?courseCode=BIT364` returns grade records
3. ✅ `POST /api/grades/assign` successfully creates grades
4. ✅ `GET /api/grades/semesters` returns ["Block 1", "Block 2"]
5. ✅ Frontend assessment page loads without 404 errors
6. ✅ Students can login and view their grades
7. ✅ Lecturers can view enrolled students with grades

**Once all criteria are met, update Status to: ✅ Deployed Successfully**