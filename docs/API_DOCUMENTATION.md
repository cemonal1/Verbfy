# Verbfy API Documentation

## 📚 **Overview**

The Verbfy API is a RESTful service built with Node.js, Express, and MongoDB, providing comprehensive functionality for the English learning platform.

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
      "createdAt": "2025-01-01T00:00:00.000Z"
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
        "fileUrl": "https://storage.verbfy.com/materials/grammar.pdf"
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

---

## 🎓 **Learning Modules Endpoints**

### **GET /verbfy-lessons**
Get all Verbfy learning lessons.

**Headers:**
```http
Authorization: Bearer <access_token>
```

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
          "content": "Hello! Let's practice talking about daily routines.",
          "timestamp": "2025-01-01T00:00:00.000Z"
        }
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

## 📞 **Support**

### **Contact Information**
- **Email**: api-support@verbfy.com
- **Documentation**: https://docs.verbfy.com
- **Status Page**: https://status.verbfy.com

---

*Last updated: January 2025*
*API Version: 1.0.0* 