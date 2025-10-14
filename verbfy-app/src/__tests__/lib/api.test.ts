import axios from 'axios'
import { authAPI, userAPI, materialsAPI, verbfyLessonsAPI, aiFeaturesAPI } from '@/lib/api'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('authAPI', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token',
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authAPI.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token',
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authAPI.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials')
      mockedAxios.post.mockRejectedValue(mockError)

      await expect(
        authAPI.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('userAPI', () => {
    it('should get user profile', async () => {
      const mockResponse = {
        data: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'student',
        },
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await userAPI.getProfile()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/profile')
      expect(result).toEqual(mockResponse.data)
    })

    it('should update user profile', async () => {
      const mockResponse = {
        data: {
          id: '1',
          name: 'Updated User',
          email: 'test@example.com',
        },
      }
      mockedAxios.put.mockResolvedValue(mockResponse)

      const result = await userAPI.updateProfile({
        name: 'Updated User',
      })

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/profile', {
        name: 'Updated User',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('materialsAPI', () => {
    it('should get materials with filters', async () => {
      const mockResponse = {
        data: {
          materials: [
            { id: '1', title: 'Material 1' },
            { id: '2', title: 'Material 2' },
          ],
          pagination: { page: 1, limit: 10, total: 2 },
        },
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await materialsAPI.getMaterials({
        page: 1,
        limit: 10,
        category: 'grammar',
      })

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/materials?page=1&limit=10&category=grammar')
      expect(result).toEqual(mockResponse.data)
    })

    it('should upload material', async () => {
      const mockResponse = {
        data: {
          id: '1',
          title: 'New Material',
          fileUrl: 'https://example.com/file.pdf',
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const formData = new FormData()
      formData.append('title', 'New Material')
      formData.append('file', new File([''], 'test.pdf'))

      const result = await materialsAPI.uploadMaterial(formData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('verbfyLessonsAPI', () => {
    it('should get lessons with filters', async () => {
      const mockResponse = {
        data: {
          lessons: [
            { id: '1', title: 'Lesson 1', type: 'VerbfyGrammar' },
            { id: '2', title: 'Lesson 2', type: 'VerbfyRead' },
          ],
          pagination: { page: 1, limit: 10, total: 2 },
        },
      }
      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await verbfyLessonsAPI.getLessons({
        page: 1,
        limit: 10,
        type: 'VerbfyGrammar',
      })

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/verbfy-lessons?page=1&limit=10&type=VerbfyGrammar')
      expect(result).toEqual(mockResponse.data)
    })

    it('should start lesson', async () => {
      const mockResponse = {
        data: {
          lessonId: '1',
          sessionId: 'session-123',
          exercises: [],
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await verbfyLessonsAPI.startLesson('1')

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/verbfy-lessons/1/start')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('aiFeaturesAPI', () => {
    it('should start AI tutoring session', async () => {
      const mockResponse = {
        data: {
          _id: 'session-123',
          sessionType: 'conversation',
          cefrLevel: 'B1',
          status: 'active',
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await aiFeaturesAPI.startTutoringSession({
        sessionType: 'conversation',
        cefrLevel: 'B1',
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/ai-features/tutoring/sessions', {
        sessionType: 'conversation',
        cefrLevel: 'B1',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should send tutoring message', async () => {
      const mockResponse = {
        data: {
          message: {
            _id: 'msg-123',
            role: 'ai',
            content: 'Hello! How can I help you today?',
            timestamp: '2023-01-01T00:00:00Z',
          },
          session: {
            _id: 'session-123',
            messages: [],
          },
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await aiFeaturesAPI.sendTutoringMessage('session-123', {
        content: 'Hello',
        messageType: 'text',
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/ai-features/tutoring/sessions/session-123/messages', {
        content: 'Hello',
        messageType: 'text',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should generate AI content', async () => {
      const mockResponse = {
        data: {
          content: {
            _id: 'content-123',
            type: 'lesson',
            title: 'AI Generated Lesson',
            cefrLevel: 'B1',
          },
          generationTime: 2.5,
          qualityScore: 0.85,
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await aiFeaturesAPI.generateContent({
        type: 'lesson',
        title: 'AI Generated Lesson',
        description: 'A lesson about grammar',
        cefrLevel: 'B1',
        difficulty: 'Intermediate',
        category: 'grammar',
        learningObjectives: ['Learn basic grammar'],
        estimatedDuration: 30,
        tags: ['grammar', 'beginner'],
      })

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/ai-features/content/generate', {
        type: 'lesson',
        title: 'AI Generated Lesson',
        description: 'A lesson about grammar',
        cefrLevel: 'B1',
        difficulty: 'Intermediate',
        category: 'grammar',
        learningObjectives: ['Learn basic grammar'],
        estimatedDuration: 30,
        tags: ['grammar', 'beginner'],
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'))

      await expect(userAPI.getProfile()).rejects.toThrow('Network Error')
    })

    it('should handle API errors with status codes', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      }
      mockedAxios.get.mockRejectedValue(mockError)

      await expect(userAPI.getProfile()).rejects.toMatchObject(mockError)
    })
  })
})