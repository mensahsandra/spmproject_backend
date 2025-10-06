# 🚀 Quiz Management Setup Guide

## Quick Start

### 1. Start the Backend Server
```bash
# In the backend directory
npm start
# or for development
npm run dev
```

### 2. Test the API
```bash
# Test if quiz endpoints are working
node test-quiz-api.js
```

### 3. Check Health
Visit: `http://localhost:3000/api/quizzes/health`

## 🔧 Troubleshooting the "Unexpected end of JSON input" Error

This error typically occurs when:

1. **Server not running**: Make sure your backend is running on port 3000
2. **CORS issues**: Check browser console for CORS errors
3. **Authentication issues**: Ensure you're logged in as a lecturer
4. **Network issues**: Check if the request is reaching the server

### Debug Steps:

1. **Check server logs**: Look for incoming requests in your server console
2. **Test without auth**: Try the test endpoint first:
   ```bash
   curl -X POST http://localhost:3000/api/quizzes/test-create \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","courseCode":"BIT364"}'
   ```
3. **Check browser network tab**: See what response you're getting

## 📋 Frontend Integration

Your frontend should send requests like this:

```javascript
// Quiz creation
const formData = new FormData();
formData.append('title', 'Midterm Quiz');
formData.append('courseCode', 'BIT364');
formData.append('startTime', '2025-01-25T09:00:00Z');
formData.append('endTime', '2025-01-25T11:00:00Z');
formData.append('description', 'Assessment covering chapters 1-5');
formData.append('maxScore', '100');
formData.append('restrictToAttendees', 'false');

// Add questions
const questions = [
  {
    type: 'text',
    question: 'What is the capital of Ghana?',
    points: 5
  }
];
formData.append('questions', JSON.stringify(questions));

// Add file if selected
if (fileInput.files[0]) {
  formData.append('attachments', fileInput.files[0]);
}

// Send request
fetch('/api/quizzes/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Quiz created:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

## 🎯 Features Implemented

### ✅ Lecturer Features
- ✅ Create quizzes with questions
- ✅ Upload file attachments
- ✅ Set start/end times
- ✅ Restrict to attendees only
- ✅ Auto-notify students
- ✅ View quiz submissions
- ✅ Bulk grade assignment
- ✅ Export grade data

### 🔄 Student Features (Coming Next)
- 📝 Receive quiz notifications
- 👀 View available quizzes
- ✍️ Answer questions (text input)
- 📎 Upload file submissions
- 📷 Capture/scan submissions
- 📊 View quiz results

## 🧪 Testing

### Test Quiz Creation
```bash
curl -X POST http://localhost:3000/api/quizzes/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Quiz" \
  -F "courseCode=BIT364" \
  -F "startTime=2025-01-25T09:00:00Z" \
  -F "endTime=2025-01-25T11:00:00Z" \
  -F "description=Test quiz description"
```

### Test Bulk Grading
```bash
curl -X POST http://localhost:3000/api/grades/bulk-assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "BIT364",
    "assessmentType": "Quiz 1",
    "score": 85,
    "maxScore": 100,
    "studentFilter": "all"
  }'
```

## 📞 Support

If you encounter issues:
1. Check server console for errors
2. Verify your authentication token
3. Test with the provided cURL commands
4. Check the browser network tab for response details

The backend is now ready for your enhanced quiz management system! 🎉