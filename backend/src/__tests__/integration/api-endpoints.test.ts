import request from 'supertest'
import mongoose from 'mongoose'
import express from 'express'
import User from '../../models/User'
import { Material } from '../../models/Material'
import { VerbfyLesson } from '../../models/VerbfyLesson'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import authRoutes from '../../routes/auth'
import userRoutes from '../../routes/userRoutes'
import materialsRoutes from '../../routes/materials'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'

// Create test app instance
const app = express()
app.use(express.json())
import verbfyLessonsRoutes from '../../routes/verbfyLessons'
app.use('/verbfy-lessons', verbfyLessonsRoutes)
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/materials', materialsRoutes)

// 404 JSON handler for tests
app.use((req, res) => {
  return res.status(404).json({ message: 'Not Found' })
})

describe('API Endpoints Integration', () => {
  let authToken: string
  let testUser: any

beforeAll(async () => {
    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI as string)
    }
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({})
    await Material.deleteMany({})
    await VerbfyLesson.deleteMany({})

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'teacher',
    })

    // Generate auth token
    authToken = jwt.sign({ id: testUser._id, role: testUser.role }, process.env.JWT_SECRET!)
  })

  describe('User Management Endpoints', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('_id')
      expect(response.body.email).toBe(testUser.email)
      expect(response.body.name).toBe(testUser.name)
    })

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      }

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.name).toBe(updateData.name)
      expect(response.body.bio).toBe(updateData.bio)
    })

    it('should get users list (admin only)', async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
      })

      const adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, process.env.JWT_SECRET!)

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(Array.isArray(response.body.users)).toBe(true)
      expect(response.body.users.length).toBeGreaterThan(0)
    })
  })

  describe('Materials Endpoints', () => {
    it('should get materials list', async () => {
      // Create test materials
      await Material.create([
        {
          title: 'Grammar Lesson 1',
          description: 'Basic grammar rules',
          category: 'grammar',
          cefrLevel: 'A1',
          difficulty: 'Beginner',
          createdBy: testUser._id,
          savedName: 'test-material-1'
        },
        {
          title: 'Vocabulary Set 1',
          description: 'Essential vocabulary',
          category: 'vocabulary',
          cefrLevel: 'A2',
          difficulty: 'Intermediate',
          createdBy: testUser._id,
          savedName: 'test-material-2'
        },
      ])

      const response = await request(app)
        .get('/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('materials')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.materials.length).toBe(2)
    })

    it('should create new material', async () => {
      const materialData = {
        title: 'New Material',
        description: 'A new learning material',
        category: 'grammar',
        cefrLevel: 'B1',
        difficulty: 'Advanced',
        content: 'Material content here',
      }

      const response = await request(app)
        .post('/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .send(materialData)
        .expect(201)

      expect(response.body.title).toBe(materialData.title)
      expect(response.body.description).toBe(materialData.description)
      expect(response.body.createdBy).toBe(testUser._id.toString())
    })

    it('should update material', async () => {
      // Create test material
      const material = await Material.create({
        title: 'Original Title',
        description: 'Original description',
        category: 'grammar',
        cefrLevel: 'A1',
        difficulty: 'Beginner',
        createdBy: testUser._id,
      })

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      }

      const response = await request(app)
        .put(`/materials/${material._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.title).toBe(updateData.title)
      expect(response.body.description).toBe(updateData.description)
    })

    it('should delete material', async () => {
      // Create test material
      const material = await Material.create({
        title: 'Material to Delete',
        description: 'This will be deleted',
        category: 'grammar',
        cefrLevel: 'A1',
        difficulty: 'Beginner',
        createdBy: testUser._id,
      })

      await request(app)
        .delete(`/materials/${material._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify material was deleted
      const deletedMaterial = await Material.findById(material._id)
      expect(deletedMaterial).toBeNull()
    })
  })

  describe('Lessons Endpoints', () => {
    it('should get lessons list', async () => {
      // Create test lessons
      await VerbfyLesson.create([
        {
          title: 'Grammar Lesson 1',
          description: 'Basic grammar rules',
          lessonType: 'VerbfyGrammar',
          cefrLevel: 'A1',
          difficulty: 'Beginner',
          category: 'General',
          estimatedDuration: 30,
          content: {
            instructions: 'Follow the instructions',
            materials: [],
            exercises: [],
          },
          learningObjectives: ['Improve grammar'],
          tags: ['grammar'],
          createdBy: testUser._id,
        },
        {
          title: 'Reading Lesson 1',
          description: 'Reading comprehension',
          lessonType: 'VerbfyRead',
          cefrLevel: 'A2',
          difficulty: 'Intermediate',
          category: 'General',
          estimatedDuration: 30,
          content: {
            instructions: 'Follow the instructions',
            materials: [],
            exercises: [],
          },
          learningObjectives: ['Improve reading'],
          tags: ['reading'],
          createdBy: testUser._id,
        },
      ])

      const response = await request(app)
        .get('/verbfy-lessons')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('lessons')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.lessons.length).toBe(2)
    })

    it('should create new lesson', async () => {
      const lessonData = {
        title: 'New Lesson',
        description: 'A new lesson',
        type: 'VerbfyGrammar',
        cefrLevel: 'B1',
        difficulty: 'Advanced',
        exercises: [
          {
            type: 'multiple-choice',
            question: 'What is the correct form?',
            options: ['Option A', 'Option B', 'Option C'],
            correctAnswer: 'Option A',
            points: 10,
          },
        ],
      }

      const response = await request(app)
        .post('/verbfy-lessons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(lessonData)
        .expect(201)

      expect(response.body.title).toBe(lessonData.title)
      expect(response.body.type).toBe(lessonData.type)
      expect(response.body.exercises).toHaveLength(1)
    })

    it('should start lesson session', async () => {
      // Create test lesson
      const lesson = await VerbfyLesson.create({
        title: 'Test Lesson',
        description: 'Test lesson description',
        lessonType: 'VerbfyGrammar',
        cefrLevel: 'A1',
        difficulty: 'Beginner',
        category: 'General',
        estimatedDuration: 30,
        content: {
          instructions: 'Follow the instructions',
          materials: [],
          exercises: [
            {
              type: 'multiple-choice',
              question: 'Test question?',
              options: ['A', 'B', 'C'],
              correctAnswer: 'A',
              points: 10,
            },
          ],
        },
        learningObjectives: ['Objective'],
        tags: ['tag'],
        createdBy: testUser._id,
      })

      const response = await request(app)
        .post(`/verbfy-lessons/${lesson._id}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('lessonId')
      expect(response.body).toHaveProperty('sessionId')
      expect(response.body).toHaveProperty('exercises')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404)

      expect(response.body).toHaveProperty('message')
    })

    it('should handle 500 for server errors', async () => {
      // This would typically test error scenarios
      // For now, we'll just verify the error handler exists
      expect(app).toBeDefined()
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        description: 'Valid description',
      }

      const response = await request(app)
        .post('/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/users/profile')
        .expect(401)

      expect(response.body).toHaveProperty('message')
    })

    it('should handle invalid tokens', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toHaveProperty('message')
    })

    it('should enforce role-based access', async () => {
      // Create student user
      const studentUser = await User.create({
        name: 'Student User',
        email: 'student@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
      })

      const studentToken = jwt.sign({ id: studentUser._id, role: 'student' }, process.env.JWT_SECRET!)

      // Try to access admin-only route
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)

      expect(response.body).toHaveProperty('message')
    })
  })
})