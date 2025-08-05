# Verbfy API Documentation

## 📚 **Overview**

The Verbfy API is a RESTful service built with Node.js, Express, and MongoDB, providing comprehensive functionality for the English learning platform. This documentation covers all endpoints, authentication, error handling, and usage examples.

---

## 🔐 **Authentication**

### **JWT Token Authentication**
All API endpoints require authentication via JWT tokens, except for public endpoints like registration and login.

```http
Authorization: Bearer <your-jwt-token>
```

### **Token Management**
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Token Refresh**: Use `/auth/refresh` endpoint

---

## 📋 **Base URL**
```
Development: http://localhost:5000/api
Production: https://api.verbfy.com/api
```

---

## 🔑 **Authentication Endpoints**

### **POST /auth/register**
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student",
  "cefrLevel": "A1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "cefrLevel": "A1"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### **POST /auth/login**
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### **POST /auth/refresh**
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

### **POST /auth/logout**
Logout user and invalidate tokens.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👤 **User Management Endpoints**

### **GET /user/profile**
Get current user profile.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "cefrLevel": "A1",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### **PUT /user/profile**
Update user profile.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "cefrLevel": "A2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Smith",
      "email": "john@example.com",
      "role": "student",
      "cefrLevel": "A2"
    }
  }
}
```

---

## 📚 **Materials Management Endpoints**

### **GET /materials**
Get all learning materials.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type`: Filter by material type (lesson, exercise, video)
- `cefrLevel`: Filter by CEFR level (A1, A2, B1, B2, C1, C2)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "material_id",
        "title": "Basic Grammar Lesson",
        "description": "Introduction to basic English grammar",
        "type": "lesson",
        "cefrLevel": "A1",
        "fileUrl": "https://storage.verbfy.com/materials/grammar.pdf",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### **POST /materials**
Upload new learning material (Teacher/Admin only).

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: Material title
- `description`: Material description
- `type`: Material type (lesson, exercise, video)
- `cefrLevel`: CEFR level
- `file`: Material file

**Response:**
```json
{
  "success": true,
  "message": "Material uploaded successfully",
  "data": {
    "material": {
      "id": "material_id",
      "title": "Advanced Vocabulary",
      "description": "Advanced English vocabulary exercises",
      "type": "exercise",
      "cefrLevel": "B2",
      "fileUrl": "https://storage.verbfy.com/materials/vocabulary.pdf"
    }
  }
}
```

### **GET /materials/:id**
Get specific material by ID.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "material": {
      "id": "material_id",
      "title": "Basic Grammar Lesson",
      "description": "Introduction to basic English grammar",
      "type": "lesson",
      "cefrLevel": "A1",
      "fileUrl": "https://storage.verbfy.com/materials/grammar.pdf",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 🎓 **Learning Modules Endpoints**

### **GET /verbfy-lessons**
Get all Verbfy learning lessons.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cefrLevel`: Filter by CEFR level
- `module`: Filter by module name
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "lesson_id",
        "title": "Greetings and Introductions",
        "description": "Learn basic greetings in English",
        "module": "Basic Communication",
        "cefrLevel": "A1",
        "duration": 30,
        "exercises": [
          {
            "id": "exercise_id",
            "type": "multiple_choice",
            "question": "How do you say hello?",
            "options": ["Hello", "Goodbye", "Thank you", "Please"],
            "correctAnswer": 0
          }
        ]
      }
    ]
  }
}
```

### **POST /verbfy-lessons**
Create new lesson (Teacher/Admin only).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Advanced Grammar",
  "description": "Complex grammar structures",
  "module": "Advanced Grammar",
  "cefrLevel": "B2",
  "duration": 45,
  "exercises": [
    {
      "type": "fill_blank",
      "question": "Complete the sentence: I ___ to school every day.",
      "correctAnswer": "go"
    }
  ]
}
```

### **GET /verbfy-lessons/:id**
Get specific lesson by ID.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": "lesson_id",
      "title": "Greetings and Introductions",
      "description": "Learn basic greetings in English",
      "module": "Basic Communication",
      "cefrLevel": "A1",
      "duration": 30,
      "exercises": [...],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 🤖 **AI Features Endpoints**

### **POST /ai/tutoring/session**
Start AI tutoring session.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "sessionType": "conversation",
  "cefrLevel": "A2",
  "topic": "Daily Routines"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_id",
      "type": "conversation",
      "cefrLevel": "A2",
      "topic": "Daily Routines",
      "messages": [
        {
          "id": "message_id",
          "role": "ai",
          "content": "Hello! Let's practice talking about daily routines. What time do you usually wake up?",
          "timestamp": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  }
}
```

### **POST /ai/tutoring/message**
Send message to AI tutor.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "sessionId": "session_id",
  "message": "I wake up at 7 AM every day."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message_id",
      "role": "user",
      "content": "I wake up at 7 AM every day.",
      "timestamp": "2025-01-01T00:00:00.000Z"
    },
    "aiResponse": {
      "id": "ai_message_id",
      "role": "ai",
      "content": "That's a good time! What do you do after waking up?",
      "timestamp": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### **GET /ai/analytics/progress**
Get AI learning progress.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "totalSessions": 15,
      "totalTime": 450,
      "cefrLevel": "A2",
      "strengths": ["vocabulary", "pronunciation"],
      "weaknesses": ["grammar", "listening"],
      "recommendations": [
        "Practice grammar exercises",
        "Listen to English podcasts"
      ]
    }
  }
}
```

---

## 📊 **CEFR Testing Endpoints**

### **GET /cefr-tests**
Get available CEFR tests.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "id": "test_id",
        "title": "A1 Level Assessment",
        "description": "Test your A1 level English skills",
        "cefrLevel": "A1",
        "duration": 30,
        "questionCount": 20
      }
    ]
  }
}
```

### **POST /cefr-tests/:id/start**
Start CEFR test.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "attempt_id",
      "testId": "test_id",
      "startedAt": "2025-01-01T00:00:00.000Z",
      "questions": [
        {
          "id": "question_id",
          "type": "multiple_choice",
          "question": "Choose the correct word: I ___ a student.",
          "options": ["am", "is", "are", "be"],
          "correctAnswer": 0
        }
      ]
    }
  }
}
```

### **POST /cefr-tests/:id/submit**
Submit CEFR test answers.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "attemptId": "attempt_id",
  "answers": [
    {
      "questionId": "question_id",
      "answer": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "score": 85,
      "cefrLevel": "A2",
      "feedback": "Good job! You're ready for A2 level.",
      "details": {
        "grammar": 80,
        "vocabulary": 90,
        "listening": 85,
        "reading": 85
      }
    }
  }
}
```

---

## 📅 **Reservation & Availability Endpoints**

### **GET /availability**
Get teacher availability.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `teacherId`: Teacher ID
- `date`: Date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "availability": [
      {
        "id": "slot_id",
        "teacherId": "teacher_id",
        "date": "2025-01-01",
        "startTime": "09:00",
        "endTime": "10:00",
        "isAvailable": true
      }
    ]
  }
}
```

### **POST /reservations**
Create lesson reservation.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "teacherId": "teacher_id",
  "date": "2025-01-01",
  "startTime": "09:00",
  "endTime": "10:00",
  "lessonType": "conversation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "id": "reservation_id",
      "teacherId": "teacher_id",
      "studentId": "student_id",
      "date": "2025-01-01",
      "startTime": "09:00",
      "endTime": "10:00",
      "lessonType": "conversation",
      "status": "confirmed"
    }
  }
}
```

---

## 💳 **Payment Endpoints**

### **POST /payments/create-session**
Create Stripe payment session.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "packageId": "package_id",
  "amount": 5000,
  "currency": "usd"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "stripe_session_id",
    "url": "https://checkout.stripe.com/pay/..."
  }
}
```

### **POST /payments/webhook**
Stripe webhook endpoint (no authentication required).

**Request Body:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "session_id",
      "payment_status": "paid",
      "amount_total": 5000
    }
  }
}
```

---

## ❌ **Error Handling**

### **Standard Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### **Common Error Codes**
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

### **HTTP Status Codes**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## 📝 **Rate Limiting**

### **Limits**
- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per minute per user
- **File uploads**: 10 requests per minute per user

### **Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔒 **Security**

### **CORS Configuration**
- **Allowed Origins**: Configured per environment
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Authorization, Content-Type

### **Data Validation**
- All input data is validated using Joi schemas
- File uploads are scanned for malware
- SQL injection protection via Mongoose

### **Encryption**
- Passwords hashed with bcrypt
- JWT tokens signed with secure keys
- HTTPS required in production

---

## 📊 **Monitoring & Analytics**

### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400
}
```

### **Metrics Endpoints**
- `/metrics/performance`: Performance metrics
- `/metrics/errors`: Error tracking
- `/metrics/usage`: API usage statistics

---

## 🚀 **SDK & Libraries**

### **JavaScript/TypeScript SDK**
```bash
npm install @verbfy/api-client
```

**Usage:**
```javascript
import { VerbfyAPI } from '@verbfy/api-client';

const api = new VerbfyAPI({
  baseURL: 'https://api.verbfy.com',
  token: 'your-jwt-token'
});

// Get user profile
const profile = await api.user.getProfile();

// Create reservation
const reservation = await api.reservations.create({
  teacherId: 'teacher_id',
  date: '2025-01-01',
  startTime: '09:00',
  endTime: '10:00'
});
```

---

## 📞 **Support**

### **Contact Information**
- **Email**: api-support@verbfy.com
- **Documentation**: https://docs.verbfy.com
- **Status Page**: https://status.verbfy.com

### **API Versioning**
- **Current Version**: v1
- **Version Header**: `Accept: application/vnd.verbfy.v1+json`
- **Deprecation Policy**: 6 months notice for breaking changes

---

*Last updated: January 2025*
*API Version: 1.0.0* 