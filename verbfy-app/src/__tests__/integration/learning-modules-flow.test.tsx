import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/context/AuthContext'
import { ModuleManagementInterface } from '@/features/learningModules/view/ModuleManagementInterface'
import { StudentLearningInterface } from '@/features/learningModules/view/StudentLearningInterface'
import { verbfyLessonsAPI } from '@/lib/api'

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  verbfyLessonsAPI: {
    getLessons: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn(),
    startLesson: jest.fn(),
    submitLesson: jest.fn(),
  },
}))

const mockRouter = {
  push: jest.fn(),
  pathname: '/learning-modules',
  query: {},
}

describe('Learning Modules Flow Integration', () => {
  const mockTeacherUser = {
    _id: '1',
    id: '1',
    name: 'Teacher User',
    email: 'teacher@example.com',
    role: 'teacher' as const,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  }

  const mockStudentUser = {
    _id: '2',
    id: '2',
    name: 'Student User',
    email: 'student@example.com',
    role: 'student' as const,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  }

  const mockLessons = [
    {
      _id: '1',
      title: 'Grammar Basics',
      description: 'Learn basic grammar rules',
      type: 'VerbfyGrammar',
      cefrLevel: 'A1',
      difficulty: 'Beginner',
      isActive: true,
      isPremium: false,
      estimatedDuration: 30,
      completionRate: 85,
      averageRating: 4.5,
      totalRatings: 120,
    },
    {
      _id: '2',
      title: 'Reading Comprehension',
      description: 'Improve reading skills',
      type: 'VerbfyRead',
      cefrLevel: 'A2',
      difficulty: 'Intermediate',
      isActive: true,
      isPremium: true,
      estimatedDuration: 45,
      completionRate: 78,
      averageRating: 4.2,
      totalRatings: 95,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Teacher Module Management Flow', () => {
    it('should load and display lessons for teacher', async () => {
      const mockAuthContext = {
        user: mockTeacherUser,
        isAuthenticated: true,
        isLoading: false,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshUser: jest.fn(),
        setUser: jest.fn(),
        setAccessToken: jest.fn(),
      }

      ;(verbfyLessonsAPI.getLessons as jest.Mock).mockResolvedValue({
        lessons: mockLessons,
        pagination: { page: 1, limit: 10, total: 2 },
      })

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ModuleManagementInterface userRole="teacher" />
        </AuthContext.Provider>
      )

      // Wait for lessons to load
      await waitFor(() => {
        expect(screen.getByText('Grammar Basics')).toBeInTheDocument()
        expect(screen.getByText('Reading Comprehension')).toBeInTheDocument()
      })

      // Should show lesson details
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
      expect(screen.getByText('Beginner')).toBeInTheDocument()
      expect(screen.getByText('Intermediate')).toBeInTheDocument()
    })

    it('should create new lesson successfully', async () => {
      const mockAuthContext = {
        user: mockTeacherUser,
        isAuthenticated: true,
        isLoading: false,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshUser: jest.fn(),
        setUser: jest.fn(),
        setAccessToken: jest.fn(),
      }

      const newLesson = {
        _id: '3',
        title: 'New Lesson',
        description: 'A new lesson',
        type: 'VerbfyGrammar',
        cefrLevel: 'B1',
        difficulty: 'Advanced',
        isActive: true,
        isPremium: false,
        estimatedDuration: 60,
      }

      ;(verbfyLessonsAPI.getLessons as jest.Mock).mockResolvedValue({
        lessons: mockLessons,
        pagination: { page: 1, limit: 10, total: 2 },
      })

      ;(verbfyLessonsAPI.createLesson as jest.Mock).mockResolvedValue(newLesson)

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ModuleManagementInterface userRole="teacher" />
        </AuthContext.Provider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Grammar Basics')).toBeInTheDocument()
      })

      // Click create lesson button
      const createButton = screen.getByRole('button', { name: /create lesson/i })
      fireEvent.click(createButton)

      // Fill in lesson form
      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const typeSelect = screen.getByLabelText(/type/i)
      const levelSelect = screen.getByLabelText(/cefr level/i)

      fireEvent.change(titleInput, { target: { value: 'New Lesson' } })
      fireEvent.change(descriptionInput, { target: { value: 'A new lesson' } })
      fireEvent.change(typeSelect, { target: { value: 'VerbfyGrammar' } })
      fireEvent.change(levelSelect, { target: { value: 'B1' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(submitButton)

      // Should create lesson
      await waitFor(() => {
        expect(verbfyLessonsAPI.createLesson).toHaveBeenCalledWith({
          title: 'New Lesson',
          description: 'A new lesson',
          type: 'VerbfyGrammar',
          cefrLevel: 'B1',
        })
      })
    })

    it('should delete lesson successfully', async () => {
      const mockAuthContext = {
        user: mockTeacherUser,
        isAuthenticated: true,
        isLoading: false,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshUser: jest.fn(),
        setUser: jest.fn(),
        setAccessToken: jest.fn(),
      }

      ;(verbfyLessonsAPI.getLessons as jest.Mock).mockResolvedValue({
        lessons: mockLessons,
        pagination: { page: 1, limit: 10, total: 2 },
      })

      ;(verbfyLessonsAPI.deleteLesson as jest.Mock).mockResolvedValue({ message: 'Lesson deleted' })

      // Mock window.confirm
      window.confirm = jest.fn(() => true)

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ModuleManagementInterface userRole="teacher" />
        </AuthContext.Provider>
      )

      // Wait for lessons to load
      await waitFor(() => {
        expect(screen.getByText('Grammar Basics')).toBeInTheDocument()
      })

      // Click delete button for first lesson
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])

      // Should confirm and delete
      expect(window.confirm).toHaveBeenCalled()
      await waitFor(() => {
        expect(verbfyLessonsAPI.deleteLesson).toHaveBeenCalledWith('1')
      })
    })
  })

  describe('Student Learning Flow', () => {
    it('should start and complete lesson successfully', async () => {
      const mockAuthContext = {
        user: mockStudentUser,
        isAuthenticated: true,
        isLoading: false,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshUser: jest.fn(),
        setUser: jest.fn(),
        setAccessToken: jest.fn(),
      }

      const mockLesson = {
        _id: '1',
        title: 'Grammar Basics',
        description: 'Learn basic grammar rules',
        type: 'VerbfyGrammar',
        cefrLevel: 'A1',
        difficulty: 'Beginner',
        exercises: [
          {
            _id: 'ex1',
            type: 'multiple-choice',
            question: 'What is the correct form of the verb "to be" for "I"?',
            options: ['am', 'is', 'are', 'be'],
            correctAnswer: 'am',
            points: 10,
          },
        ],
      }

      const mockSession = {
        lessonId: '1',
        sessionId: 'session-123',
        exercises: mockLesson.exercises,
      }

      ;(verbfyLessonsAPI.startLesson as jest.Mock).mockResolvedValue(mockSession)
      ;(verbfyLessonsAPI.submitLesson as jest.Mock).mockResolvedValue({
        score: 100,
        totalPoints: 100,
        completedAt: new Date().toISOString(),
      })

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <StudentLearningInterface lessonId="1" />
        </AuthContext.Provider>
      )

      // Wait for lesson to load
      await waitFor(() => {
        expect(screen.getByText('Grammar Basics')).toBeInTheDocument()
      })

      // Should start lesson
      await waitFor(() => {
        expect(verbfyLessonsAPI.startLesson).toHaveBeenCalledWith('1')
      })

      // Answer the question
      const correctOption = screen.getByLabelText('am')
      fireEvent.click(correctOption)

      // Submit lesson
      const submitButton = screen.getByRole('button', { name: /submit/i })
      fireEvent.click(submitButton)

      // Should submit lesson
      await waitFor(() => {
        expect(verbfyLessonsAPI.submitLesson).toHaveBeenCalledWith('1', {
          answers: [{ exerciseId: 'ex1', answer: 'am' }],
          timeSpent: expect.any(Number),
        })
      })
    })

    it('should handle lesson errors gracefully', async () => {
      const mockAuthContext = {
        user: mockStudentUser,
        isAuthenticated: true,
        isLoading: false,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshUser: jest.fn(),
        setUser: jest.fn(),
        setAccessToken: jest.fn(),
      }

      const mockError = new Error('Lesson not found')
      ;(verbfyLessonsAPI.startLesson as jest.Mock).mockRejectedValue(mockError)

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <StudentLearningInterface lessonId="999" />
        </AuthContext.Provider>
      )

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/lesson not found/i)).toBeInTheDocument()
      })
    })
  })
})