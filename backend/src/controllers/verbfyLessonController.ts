import { Request, Response } from 'express';
import { VerbfyLesson } from '../models/VerbfyLesson';
import { LessonAttempt } from '../models/LessonAttempt';
import User from '../models/User';
import { LessonProgress } from '../models/LessonProgress';
import { AuthRequest } from '../middleware/auth';

export class VerbfyLessonController {
  // Get all lessons with filtering
  static async getLessons(req: Request, res: Response): Promise<void> {
    try {
      const {
        lessonType,
        cefrLevel,
        category,
        isPremium,
        page = 1,
        limit = 10,
        search
      } = req.query;

      const filter: any = { isActive: true };

      if (lessonType) filter.lessonType = lessonType;
      if (cefrLevel) filter.cefrLevel = cefrLevel;
      if (category) filter.category = category;
      if (isPremium !== undefined) filter.isPremium = isPremium === 'true';

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const lessons = await VerbfyLesson.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await VerbfyLesson.countDocuments(filter);

      res.json({
        lessons,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching lessons', error: error.message });
    }
  }

  // Get lesson by ID
  static async getLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const lesson = await VerbfyLesson.findById(id)
        .populate('createdBy', 'name');

      if (!lesson) {
        res.status(404).json({ message: 'Lesson not found' });
        return;
      }

      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching lesson', error: error.message });
    }
  }

  // Create new lesson (admin/teacher only)
  static async createLesson(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const payload: any = req.body;

      // Normalize payload to VerbfyLesson schema
      const normalized: any = {
        title: payload.title,
        description: payload.description,
        lessonType: payload.lessonType || payload.type, // accept `type` alias
        cefrLevel: payload.cefrLevel,
        difficulty: payload.difficulty,
        category: payload.category || 'General',
        estimatedDuration: payload.estimatedDuration || 30,
        content: {
          instructions: (payload.content?.instructions) || 'Follow the instructions',
          materials: (payload.content?.materials) || [],
          exercises: (payload.content?.exercises) || payload.exercises || [],
          vocabulary: (payload.content?.vocabulary) || [],
          grammar: (payload.content?.grammar) || [],
        },
        learningObjectives: payload.learningObjectives || ['Practice and improve skills'],
        prerequisites: payload.prerequisites || [],
        tags: payload.tags || [],
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        isPremium: payload.isPremium !== undefined ? payload.isPremium : false,
        createdBy: req.user.id,
      };

      const lesson = new VerbfyLesson(normalized);
      await lesson.save();

      // Respond in simplified format expected by tests
      res.status(201).json({
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.lessonType,
        cefrLevel: lesson.cefrLevel,
        difficulty: lesson.difficulty,
        exercises: lesson.content.exercises,
        createdBy: lesson.createdBy,
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating lesson', error: error.message });
    }
  }

  // Update lesson (admin/teacher only)
  static async updateLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const lesson = await VerbfyLesson.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!lesson) {
        res.status(404).json({ message: 'Lesson not found' });
        return;
      }

      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating lesson', error: error.message });
    }
  }

  // Delete lesson (admin/teacher only)
  static async deleteLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const lesson = await VerbfyLesson.findByIdAndDelete(id);

      if (!lesson) {
        res.status(404).json({ message: 'Lesson not found' });
        return;
      }

      res.json({ message: 'Lesson deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting lesson', error: error.message });
    }
  }

  // Start lesson attempt
  static async startLesson(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const { lessonId } = req.params;
      const studentId = req.user.id;

      const lesson = await VerbfyLesson.findById(lessonId);
      if (!lesson) {
        res.status(404).json({ message: 'Lesson not found' });
        return;
      }

      // Check if user has access to premium lesson
      if (lesson.isPremium) {
        const user = await User.findById(studentId);
        if (user?.subscriptionStatus !== 'active') {
          res.status(403).json({ message: 'Premium lesson requires active subscription' });
          return;
        }
      }

      // Create lesson attempt
      const attempt = new LessonAttempt({
        student: studentId,
        lessonId,
        resourceType: 'lesson',
        lessonType: lesson.lessonType,
        cefrLevel: lesson.cefrLevel,
        startedAt: new Date(),
        maxScore: lesson.content.exercises.reduce((sum, ex) => sum + ex.points, 0)
      });

      await attempt.save();

      // Respond in simplified format expected by tests
      res.json({
        lessonId: lesson._id,
        sessionId: attempt._id,
        exercises: lesson.content.exercises.map((ex) => ({
          type: ex.type,
          question: ex.question,
          options: ex.options,
          points: ex.points,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error starting lesson', error: error.message });
    }
  }

  // Submit lesson attempt
  static async submitLesson(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const { attemptId } = req.params;
      const { answers, timeSpent } = req.body;

      const attempt = await LessonAttempt.findById(attemptId);
      if (!attempt) {
        res.status(404).json({ message: 'Attempt not found' });
        return;
      }

      if (attempt.student.toString() !== req.user.id) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }

      const lesson = await VerbfyLesson.findById(attempt.lessonId);
      if (!lesson) {
        res.status(404).json({ message: 'Lesson not found' });
        return;
      }

      // Calculate score and process answers
      let totalScore = 0;
      const processedAnswers = answers.map((answer: any) => {
        const exercise = lesson.content.exercises[answer.questionIndex];
        const isCorrect = this.checkAnswer(answer.studentAnswer, exercise.correctAnswer);
        const points = isCorrect ? exercise.points : 0;
        totalScore += points;

        return {
          questionIndex: answer.questionIndex,
          question: exercise.question,
          studentAnswer: answer.studentAnswer,
          correctAnswer: exercise.correctAnswer,
          isCorrect,
          points,
          maxPoints: exercise.points,
          timeSpent: answer.timeSpent || 0
        };
      });

      const finalScore = Math.round((totalScore / attempt.maxScore) * 100);
      const isPassed = finalScore >= 70; // 70% passing threshold

      // Calculate skill improvements
      const skillImprovements = this.calculateSkillImprovements(lesson, processedAnswers);

      // Update attempt
      attempt.answers = processedAnswers;
      attempt.score = finalScore;
      attempt.timeSpent = timeSpent;
      attempt.completedAt = new Date();
      attempt.isCompleted = true;
      attempt.isPassed = isPassed;
      attempt.skills = skillImprovements;
      attempt.feedback = this.generateFeedback(lesson, processedAnswers, finalScore);

      await attempt.save();

      // Update lesson progress
      await this.updateLessonProgress(req.user.id, lesson, finalScore, timeSpent);

      res.json({
        score: finalScore,
        maxScore: attempt.maxScore,
        isPassed,
        feedback: attempt.feedback,
        skillImprovements
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting lesson', error: error.message });
    }
  }

  // Get lesson categories
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await VerbfyLesson.distinct('category');
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
  }

  // Get lesson statistics
  static async getLessonStats(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;

      const stats = await LessonAttempt.aggregate([
        { $match: { lessonId: lessonId, isCompleted: true } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            averageScore: { $avg: '$score' },
            averageTime: { $avg: '$timeSpent' },
            passRate: {
              $avg: { $cond: ['$isPassed', 1, 0] }
            }
          }
        }
      ]);

      res.json(stats[0] || {
        totalAttempts: 0,
        averageScore: 0,
        averageTime: 0,
        passRate: 0
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching lesson stats', error: error.message });
    }
  }

  // Helper methods
  private static checkAnswer(studentAnswer: any, correctAnswer: any): boolean {
    if (Array.isArray(correctAnswer)) {
      if (Array.isArray(studentAnswer)) {
        return studentAnswer.length === correctAnswer.length &&
               studentAnswer.every((ans: any) => correctAnswer.includes(ans));
      }
      return correctAnswer.includes(studentAnswer);
    }
    return studentAnswer === correctAnswer;
  }

  private static calculateSkillImprovements(lesson: any, answers: any[]) {
    const skillWeights = {
      grammar: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      listening: 0,
      vocabulary: 0
    };

    // Calculate skill improvements based on lesson type and performance
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAnswers = answers.length;
    const performanceRatio = correctAnswers / totalAnswers;

    switch (lesson.lessonType) {
      case 'VerbfyGrammar':
        skillWeights.grammar = performanceRatio * 100;
        break;
      case 'VerbfyRead':
        skillWeights.reading = performanceRatio * 100;
        break;
      case 'VerbfyWrite':
        skillWeights.writing = performanceRatio * 100;
        break;
      case 'VerbfySpeak':
        skillWeights.speaking = performanceRatio * 100;
        break;
      case 'VerbfyListen':
        skillWeights.listening = performanceRatio * 100;
        break;
      case 'VerbfyVocab':
        skillWeights.vocabulary = performanceRatio * 100;
        break;
    }

    return skillWeights;
  }

  private static generateFeedback(lesson: any, answers: any[], score: number) {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAnswers = answers.length;
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];

    if (score >= 90) {
      strengths.push('Excellent performance!');
      recommendations.push('Consider moving to the next level');
    } else if (score >= 70) {
      strengths.push('Good understanding of the material');
      recommendations.push('Review areas with lower scores');
    } else {
      areasForImprovement.push('Need more practice with this topic');
      recommendations.push('Revisit the lesson materials');
      recommendations.push('Practice with similar exercises');
    }

    return {
      overall: `You scored ${score}% on this lesson. ${score >= 70 ? 'Well done!' : 'Keep practicing!'}`,
      strengths,
      areasForImprovement,
      recommendations
    };
  }

  private static async updateLessonProgress(studentId: string, lesson: any, score: number, timeSpent: number) {
    try {
      let progress = await LessonProgress.findOne({
        student: studentId,
        lessonType: lesson.lessonType,
        cefrLevel: lesson.cefrLevel
      });

      if (!progress) {
        progress = new LessonProgress({
          student: studentId,
          lessonType: lesson.lessonType,
          level: lesson.difficulty,
          cefrLevel: lesson.cefrLevel,
          totalLessons: 1,
          completedLessons: 1,
          averageScore: score,
          totalTimeSpent: timeSpent,
          lastLessonDate: new Date(),
          currentStreak: 1,
          longestStreak: 1,
          skills: {
            grammar: lesson.lessonType === 'VerbfyGrammar' ? score : 0,
            reading: lesson.lessonType === 'VerbfyRead' ? score : 0,
            writing: lesson.lessonType === 'VerbfyWrite' ? score : 0,
            speaking: lesson.lessonType === 'VerbfySpeak' ? score : 0,
            listening: lesson.lessonType === 'VerbfyListen' ? score : 0,
            vocabulary: lesson.lessonType === 'VerbfyVocab' ? score : 0
          }
        });
      } else {
        progress.totalLessons += 1;
        progress.completedLessons += 1;
        progress.averageScore = Math.round(
          (progress.averageScore * (progress.completedLessons - 1) + score) / progress.completedLessons
        );
        progress.totalTimeSpent += timeSpent;
        progress.lastLessonDate = new Date();

        // Update streak
        const lastLessonDate = progress.lastLessonDate;
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastLessonDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
          progress.currentStreak += 1;
          if (progress.currentStreak > progress.longestStreak) {
            progress.longestStreak = progress.currentStreak;
          }
        } else {
          progress.currentStreak = 1;
        }

        // Update skills
        const skillKey = lesson.lessonType.toLowerCase().replace('verbfy', '') as keyof typeof progress.skills;
        if (skillKey in progress.skills) {
          progress.skills[skillKey] = Math.round(
            (progress.skills[skillKey] * (progress.completedLessons - 1) + score) / progress.completedLessons
          );
        }
      }

      await progress.save();
    } catch (error: any) {
      console.error('Error updating lesson progress:', error);
    }
  }
}