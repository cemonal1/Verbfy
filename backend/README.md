# Verbfy Backend (Express + TypeScript + MongoDB)

This is the backend REST API for the Verbfy language learning platform.

## Features
- Express.js + TypeScript
- MongoDB (Mongoose)
- JWT authentication
- User roles: student, teacher
- REST API (no frontend/views)
- Socket.IO ready for real-time features

## Folder Structure
```
backend/
  src/
    config/         # DB connection
    controllers/    # Route logic
    middleware/     # Auth, error handling
    models/         # Mongoose models
    routes/         # Express routers
    utils/          # Helpers (e.g., JWT)
    index.ts        # Entry point
```

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file in the backend root:
   ```env
   MONGO_URI=mongodb://localhost:27017/verbfy
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
3. Start the server (dev):
   ```sh
   npm run dev
   ```

## API Endpoints
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get JWT
- (More endpoints coming soon...)

## Notes
- No database seeding yet.
- No frontend code here.
- Expand with reservations, materials, feedback, etc. as needed. 