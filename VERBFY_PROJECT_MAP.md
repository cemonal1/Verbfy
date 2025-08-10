# 🗺️ VERBFY PROJECT MAP

## 📍 **PROJECT OVERVIEW**

**Verbfy** is a premium English learning platform that connects students with teachers through real-time video lessons, featuring advanced AI-powered learning tools, comprehensive analytics, and enterprise-grade infrastructure.

---

## 🏗️ **ARCHITECTURE DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                VERBFY PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   FRONTEND      │    │    BACKEND      │    │   DATABASE      │            │
│  │  (Next.js)      │◄──►│   (Express)     │◄──►│   (MongoDB)     │            │
│  │                 │    │                 │    │                 │            │
│  │ • TypeScript    │    │ • TypeScript    │    │ • 25 Models     │            │
│  │ • React         │    │ • Node.js       │    │ • Indexes       │            │
│  │ • TailwindCSS   │    │ • JWT Auth      │    │ • Transactions  │            │
│  │ • LiveKit       │    │ • Socket.IO     │    │ • Validation    │            │
│  │ • Zustand       │    │ • Multer        │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                       │                    │
│           │                       │                       │                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   EXTERNAL      │    │   REAL-TIME     │    │   STORAGE       │            │
│  │   SERVICES      │    │   SERVICES      │    │                 │            │
│  │                 │    │                 │    │                 │            │
│  │ • Stripe        │    │ • LiveKit       │    │ • File Uploads  │            │
│  │ • Email         │    │ • Socket.IO     │    │ • Static Assets │            │
│  │ • SMS           │    │ • WebRTC        │    │ • CDN           │            │
│  │ • Analytics     │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CLIENT    │    │   FRONTEND  │    │   BACKEND   │    │   DATABASE  │
│  (Browser)  │    │  (Next.js)  │    │ (Express)   │    │ (MongoDB)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. User Action    │                   │                   │
       │──────────────────►│                   │                   │
       │                   │ 2. API Request    │                   │
       │                   │──────────────────►│                   │
       │                   │                   │ 3. Database Query │
       │                   │                   │──────────────────►│
       │                   │                   │ 4. Query Result   │
       │                   │                   │◄──────────────────│
       │                   │ 5. API Response   │                   │
       │                   │◄──────────────────│                   │
       │ 6. UI Update      │                   │                   │
       │◄──────────────────│                   │                   │
```

---

## 🎯 **FEATURE MAP**

### **Core Features**
```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE FEATURES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ AUTHENTICATION │  │ USER MANAGEMENT │  │ VIDEO CONFERENCING │            │
│  │             │  │             │  │             │            │
│  │ • JWT Auth  │  │ • Profiles  │  │ • LiveKit   │            │
│  │ • Roles     │  │ • Settings  │  │ • WebRTC    │            │
│  │ • Permissions│  │ • Preferences│  │ • Screen Share│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ LESSON MANAGEMENT │  │ CONTENT MANAGEMENT │  │ COMMUNICATION │            │
│  │             │  │             │  │             │            │
│  │ • Booking   │  │ • Materials │  │ • Chat      │            │
│  │ • Scheduling│  │ • Upload    │  │ • Messages  │            │
│  │ • Progress  │  │ • Sharing   │  │ • Notifications│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Advanced Features**
```
┌─────────────────────────────────────────────────────────────────┐
│                     ADVANCED FEATURES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ AI LEARNING │  │ ANALYTICS   │  │ ENTERPRISE  │            │
│  │             │  │             │  │             │            │
│  │ • AI Tutor  │  │ • Dashboard │  │ • Multi-tenant│            │
│  │ • Content Gen│  │ • Reports   │  │ • Roles     │            │
│  │ • Adaptive  │  │ • Insights  │  │ • Audit     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ LEARNING    │  │ PAYMENT     │  │ SECURITY    │            │
│  │ MODULES     │  │             │  │             │            │
│  │             │  │             │  │             │            │
│  │ • CEFR Tests│  │ • Stripe    │  │ • JWT       │            │
│  │ • Curriculum│  │ • Subscriptions│  │ • Rate Limiting│            │
│  │ • Progress  │  │ • Tokens    │  │ • CORS      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 **DEPENDENCY MAP**

### **Frontend Dependencies**
```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND DEPENDENCIES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   CORE      │  │   UI/UX     │  │   STATE     │            │
│  │             │  │             │  │             │            │
│  │ • Next.js   │  │ • TailwindCSS│  │ • React Context│            │
│  │ • TypeScript│  │ • Heroicons │  │ • Zustand   │            │
│  │ • React     │  │ • Recharts  │  │ • Hooks     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   REAL-TIME │  │   PAYMENT   │  │   UTILS     │            │
│  │             │  │             │  │             │            │
│  │ • LiveKit   │  │ • Stripe    │  │ • Axios     │            │
│  │ • Socket.IO │  │ • React Stripe│  │ • React Dropzone│            │
│  │ • WebRTC    │  │ • Payment UI│  │ • React Hot Toast│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Backend Dependencies**
```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND DEPENDENCIES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   CORE      │  │   DATABASE  │  │   AUTH      │            │
│  │             │  │             │  │             │            │
│  │ • Express   │  │ • MongoDB   │  │ • JWT       │            │
│  │ • TypeScript│  │ • Mongoose  │  │ • bcryptjs  │            │
│  │ • Node.js   │  │ • Validation│  │ • Cookies   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   REAL-TIME │  │   SECURITY  │  │   UTILS     │            │
│  │             │  │             │  │             │            │
│  │ • Socket.IO │  │ • Helmet    │  │ • Multer    │            │
│  │ • LiveKit   │  │ • CORS      │  │ • UUID      │            │
│  │ • WebRTC    │  │ • Rate Limit│  │ • Date Utils│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **DATABASE RELATIONSHIP MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │    USER     │    │ ORGANIZATION│    │     ROLE    │        │
│  │             │    │             │    │             │        │
│  │ • id        │◄──►│ • id        │◄──►│ • id        │        │
│  │ • name      │    │ • name      │    │ • name      │        │
│  │ • email     │    │ • type      │    │ • permissions│        │
│  │ • role      │    │ • settings  │    │ • hierarchy │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│           │                   │                   │            │
│           │                   │                   │            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  RESERVATION│    │   LESSON    │    │  MATERIAL   │        │
│  │             │    │             │    │             │        │
│  │ • id        │◄──►│ • id        │◄──►│ • id        │        │
│  │ • userId    │    │ • type      │    │ • title     │        │
│  │ • teacherId │    │ • content   │    │ • type      │        │
│  │ • date      │    │ • progress  │    │ • url       │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│           │                   │                   │            │
│           │                   │                   │            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   PAYMENT   │    │  ANALYTICS  │    │   AUDIT     │        │
│  │             │    │             │    │             │        │
│  │ • id        │◄──►│ • id        │◄──►│ • id        │        │
│  │ • userId    │    │ • userId    │    │ • userId    │        │
│  │ • amount    │    │ • metrics   │    │ • action    │        │
│  │ • status    │    │ • insights  │    │ • timestamp │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 **SECURITY MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    APPLICATION LAYER                        │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │ AUTHENTICATION │  │ AUTHORIZATION │  │ VALIDATION │        │ │
│  │  │             │  │             │  │             │        │ │
│  │  │ • JWT       │  │ • RBAC      │  │ • Input     │        │ │
│  │  │ • Refresh   │  │ • Permissions│  │ • Sanitization│        │ │
│  │  │ • Sessions  │  │ • Roles     │  │ • Schema    │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    INFRASTRUCTURE LAYER                     │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │   NETWORK   │  │   SERVER    │  │   DATABASE  │        │ │
│  │  │             │  │             │  │             │        │ │
│  │  │ • HTTPS/SSL │  │ • Helmet    │  │ • Encryption│        │ │
│  │  │ • CORS      │  │ • Rate Limit│  │ • Indexes   │        │ │
│  │  │ • CSP       │  │ • Headers   │  │ • Validation│        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **DEPLOYMENT MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    PRODUCTION ENVIRONMENT                   │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │   NGINX     │  │   DOCKER    │  │   MONITORING│        │ │
│  │  │             │  │             │  │             │        │ │
│  │  │ • Reverse   │  │ • Containers│  │ • Health    │        │ │
│  │  │   Proxy     │  │ • Compose   │  │   Checks    │        │ │
│  │  │ • SSL       │  │ • Images    │  │ • Logging   │        │ │
│  │  │ • Load Bal  │  │ • Volumes   │  │ • Alerts    │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DEVELOPMENT ENVIRONMENT                  │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │   LOCAL     │  │   DOCKER    │  │   TOOLS     │        │ │
│  │  │             │  │             │  │             │        │ │
│  │  │ • Dev Server│  │ • Compose   │  │ • Hot Reload│        │ │
│  │  │ • Hot Reload│  │ • Volumes   │  │ • Debugging │        │ │
│  │  │ • Debugging │  │ • Networks  │  │ • Testing   │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 **API ENDPOINT MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   AUTH      │  │   USERS     │  │   LESSONS   │            │
│  │             │  │             │  │             │            │
│  │ POST /login │  │ GET /users  │  │ GET /lessons│            │
│  │ POST /register│  │ PUT /users   │  │ POST /lessons│            │
│  │ POST /refresh│  │ DELETE /users│  │ PUT /lessons │            │
│  │ POST /logout│  │             │  │ DELETE /lessons│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  MATERIALS  │  │   PAYMENTS  │  │  ANALYTICS  │            │
│  │             │  │             │  │             │            │
│  │ GET /materials│  │ POST /payments│  │ GET /analytics│            │
│  │ POST /materials│  │ GET /payments │  │ POST /analytics│            │
│  │ PUT /materials│  │ PUT /payments │  │ DELETE /analytics│            │
│  │ DELETE /materials│  │ DELETE /payments│  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **USER JOURNEY MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEYS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   STUDENT   │  │   TEACHER   │  │    ADMIN    │            │
│  │             │  │             │  │             │            │
│  │ 1. Register │  │ 1. Register │  │ 1. Login    │            │
│  │ 2. Profile  │  │ 2. Profile  │  │ 2. Dashboard│            │
│  │ 3. Book     │  │ 3. Schedule │  │ 3. Users    │            │
│  │ 4. Learn    │  │ 4. Teach    │  │ 4. Analytics│            │
│  │ 5. Progress │  │ 5. Analytics│  │ 5. Settings │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   FEATURES  │  │   LEARNING  │  │   BUSINESS  │            │
│  │             │  │             │  │             │            │
│  │ • Video     │  │ • CEFR      │  │ • Payments  │            │
│  │ • Chat      │  │ • Curriculum│  │ • Analytics │            │
│  │ • Materials │  │ • Progress  │  │ • Reports   │            │
│  │ • Groups    │  │ • AI Tutor  │  │ • Settings  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **DATA FLOW PATTERNS**

### **Authentication Flow**
```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Token
   ↓
4. Return Token + User Data
   ↓
5. Store in Context/State
   ↓
6. Redirect to Dashboard
```

### **Lesson Booking Flow**
```
1. Student Selects Teacher
   ↓
2. Choose Available Time
   ↓
3. Create Reservation
   ↓
4. Send Notifications
   ↓
5. Confirm Booking
   ↓
6. Join Video Room
```

### **Content Management Flow**
```
1. Upload Material
   ↓
2. Validate File
   ↓
3. Store in Database
   ↓
4. Generate Preview
   ↓
5. Share with Users
   ↓
6. Track Usage
```

---

## 📈 **PERFORMANCE MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE METRICS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   FRONTEND  │  │   BACKEND   │  │   DATABASE  │            │
│  │             │  │             │  │             │            │
│  │ • Load Time │  │ • Response  │  │ • Query     │            │
│  │ • Bundle    │  │   Time      │  │   Time      │            │
│  │   Size      │  │ • Throughput│  │ • Indexes   │            │
│  │ • Rendering │  │ • Memory    │  │ • Connections│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   NETWORK   │  │   CACHING   │  │   MONITORING│            │
│  │             │  │             │  │             │            │
│  │ • Latency   │  │ • Redis     │  │ • Health    │            │
│  │ • Bandwidth │  │ • CDN       │  │   Checks    │            │
│  │ • CDN       │  │ • Browser   │  │ • Logging   │            │
│  │ • SSL       │  │   Cache     │  │ • Alerts    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **SCALABILITY MAP**

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCALABILITY STRATEGY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ HORIZONTAL  │  │   VERTICAL  │  │   MICRO     │            │
│  │ SCALING     │  │   SCALING   │  │   SERVICES  │            │
│  │             │  │             │  │             │            │
│  │ • Load      │  │ • CPU       │  │ • Auth      │            │
│  │   Balancing │  │ • Memory    │  │ • Video     │            │
│  │ • Multiple  │  │ • Storage   │  │ • Chat      │            │
│  │   Instances │  │ • Network   │  │ • Analytics │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                    │
│           └───────────────┼───────────────┘                    │
│                           │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   DATABASE  │  │   CACHING   │  │   CDN       │            │
│  │             │  │             │  │             │            │
│  │ • Sharding  │  │ • Redis     │  │ • Static    │            │
│  │ • Replication│  │ • Memory    │  │   Assets    │            │
│  │ • Indexes   │  │ • CDN       │  │ • Images    │            │
│  │ • Clustering│  │ • Browser   │  │ • Videos    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*This project map provides a comprehensive overview of the Verbfy platform's architecture, relationships, dependencies, and operational patterns. It serves as a guide for understanding the system's complexity and scalability.*
