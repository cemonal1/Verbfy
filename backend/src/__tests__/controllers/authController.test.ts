import request from 'supertest'
import mongoose from 'mongoose'
import express from 'express'
import User from '../../models/User'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import authRoutes from '../../routes/auth'

// Create test app instance
const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

describe('Auth Controller', () => {
  beforeAll(async () => {
    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({})
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.user.name).toBe(userData.name)
      expect(response.body.user.role).toBe(userData.role)
      expect(response.body.user).not.toHaveProperty('password')

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: userData.email })
      expect(savedUser).toBeTruthy()
      expect(savedUser?.name).toBe(userData.name)
    })

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      }

      // Create first user
      await request(app).post('/auth/register').send(userData)

      // Try to create second user with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })

    it('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'student',
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })

    it('should validate password strength', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        role: 'student',
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10)
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'student',
      })
    })

    it('should login user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(loginData.email)
      expect(response.body.user).not.toHaveProperty('password')

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!)
      expect(decoded).toHaveProperty('userId')
    })

    it('should not login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('GET /auth/profile', () => {
    let token: string
    let user: any

    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10)
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'student',
      })

      // Generate token
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!)
    })

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('_id')
      expect(response.body.email).toBe(user.email)
      expect(response.body.name).toBe(user.name)
      expect(response.body.role).toBe(user.role)
      expect(response.body).not.toHaveProperty('password')
    })

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401)

      expect(response.body).toHaveProperty('message')
    })

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200)

      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Logged out successfully')
    })
  })
}) 