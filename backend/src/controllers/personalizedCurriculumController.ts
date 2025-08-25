import { Request, Response } from 'express';
import { PersonalizedCurriculum } from '../models/PersonalizedCurriculum';
import { VerbfyLesson } from '../models/VerbfyLesson';
import { CEFRTest } from '../models/CEFRTest';
import User from '../models/User';
import { LessonProgress } from '../models/LessonProgress';
import { AuthRequest } from '../middleware/auth';

export class PersonalizedCurriculumController {
  // Get user's personalized curriculum
  static async getCurriculum(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;

      let curriculum = await PersonalizedCurriculum.findOne({ student: studentId })
        .populate('curriculumPath.lessons.lessonId')
        .populate('curriculumPath.tests.testId');

      if (!curriculum) {
        return res.status(404).json({ message: 'No personalized curriculum found' });
      }

      res.json(curriculum);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching curriculum', error: error.message });
    }
  }

  // Create personalized curriculum
  static async createCurriculum(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;
      const { currentCEFRLevel, targetCEFRLevel, learningGoals } = req.body;

      // Check if curriculum already exists
      const existingCurriculum = await PersonalizedCurriculum.findOne({ student: studentId });
      if (existingCurriculum) {
        return res.status(400).json({ message: 'Curriculum already exists for this student' });
      }

      // Get user's current progress
      const user = await User.findById(studentId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate curriculum path
      const curriculumPath = await this.generateCurriculumPath(
        currentCEFRLevel,
        targetCEFRLevel,
        learningGoals
      );

      // Create curriculum
      const curriculum = new PersonalizedCurriculum({
        student: studentId,
        currentCEFRLevel,
        targetCEFRLevel,
        learningGoals,
        curriculumPath,
        progress: {
          currentPhase: 1,
          lessonsCompleted: 0,
          totalLessons: curriculumPath.reduce((total, phase) => 
            total + phase.lessons.length, 0),
          testsCompleted: 0,
          totalTests: curriculumPath.reduce((total, phase) => 
            total + phase.tests.length, 0),
          overallProgress: 0
        }
      });

      await curriculum.save();

      res.status(201).json(curriculum);
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating curriculum', error: error.message });
    }
  }

  // Update curriculum progress
  static async updateProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;
      const { lessonId, testId, score, timeSpent } = req.body;

      const curriculum = await PersonalizedCurriculum.findOne({ student: studentId });
      if (!curriculum) {
        return res.status(404).json({ message: 'Curriculum not found' });
      }

      // Update lesson progress
      if (lessonId) {
        await this.updateLessonProgress(curriculum, lessonId, score, timeSpent);
      }

      // Update test progress
      if (testId) {
        await this.updateTestProgress(curriculum, testId, score);
      }

      // Check if phase is completed
      await this.checkPhaseCompletion(curriculum);

      // Recalculate overall progress
      await this.recalculateProgress(curriculum);

      res.json(curriculum);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating progress', error: error.message });
    }
  }

  // Get personalized recommendations
  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;

      const curriculum = await PersonalizedCurriculum.findOne({ student: studentId });
      if (!curriculum) {
        return res.status(404).json({ message: 'Curriculum not found' });
      }

      // Generate new recommendations
      await this.generateRecommendations(curriculum);

      res.json(curriculum.recommendations);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
    }
  }

  // Update study schedule
  static async updateStudySchedule(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;
      const { studySchedule } = req.body;

      const curriculum = await PersonalizedCurriculum.findOne({ student: studentId });
      if (!curriculum) {
        return res.status(404).json({ message: 'Curriculum not found' });
      }

      curriculum.studySchedule = studySchedule;
      await curriculum.save();

      res.json(curriculum);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating study schedule', error: error.message });
    }
  }

  // Get curriculum analytics
  static async getAnalytics(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;

      const curriculum = await PersonalizedCurriculum.findOne({ student: studentId });
      if (!curriculum) {
        return res.status(404).json({ message: 'Curriculum not found' });
      }

      // Get recent attempts
      const recentAttempts = await this.getRecentAttempts(studentId);

      // Calculate skill progress
      const skillProgress = await this.calculateSkillProgress(studentId);

      // Calculate weekly progress
      const weeklyProgress = await this.calculateWeeklyProgress(studentId);

      res.json({
        curriculum: curriculum.progress,
        recentAttempts,
        skillProgress,
        weeklyProgress
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
  }

  // Complete a recommendation
  static async completeRecommendation(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;
      const { recommendationId } = req.params;

      const curriculum = await PersonalizedCurriculum.findOne({ student: studentId });
      if (!curriculum) {
        return res.status(404).json({ message: 'Curriculum not found' });
      }

      // Find recommendation by index since _id might not be available
      const recommendationIndex = curriculum.recommendations.findIndex((r, index) => 
        `${curriculum._id}-${index}` === recommendationId
      );
      
      if (recommendationIndex === -1) {
        return res.status(404).json({ message: 'Recommendation not found' });
      }

      curriculum.recommendations[recommendationIndex].isCompleted = true;
      await curriculum.save();

      res.json({ message: 'Recommendation completed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error completing recommendation', error: error.message });
    }
  }

  // Helper methods
  private static async generateCurriculumPath(
    currentLevel: string,
    targetLevel: string,
    learningGoals: any[]
  ) {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(targetLevel);

    if (currentIndex === -1 || targetIndex === -1 || currentIndex >= targetIndex) {
      throw new Error('Invalid CEFR levels');
    }

    const curriculumPath = [];
    let phaseNumber = 1;

    for (let i = currentIndex; i <= targetIndex; i++) {
      const level = levels[i];
      const isLastLevel = i === targetIndex;

      // Get lessons for this level
      const lessons = await VerbfyLesson.find({
        cefrLevel: level,
        isActive: true,
        isPremium: false
      }).limit(10);

      // Get tests for this level
      const tests = await CEFRTest.find({
        cefrLevel: level,
        testType: isLastLevel ? 'certification' : 'progress',
        isActive: true,
        isPremium: false
      }).limit(3);

      const phase = {
        phase: phaseNumber,
        title: `${level} Level Mastery`,
        description: `Complete ${level} level lessons and assessments`,
        estimatedDuration: Math.ceil((lessons.length * 30 + tests.length * 60) / 60), // in hours
        lessons: lessons.map((lesson, index) => ({
          lessonId: lesson._id,
          lessonType: lesson.lessonType,
          cefrLevel: lesson.cefrLevel,
          order: index + 1,
          isCompleted: false
        })),
        tests: tests.map((test, index) => ({
          testId: test._id,
          testType: test.testType,
          cefrLevel: test.cefrLevel,
          order: index + 1,
          isCompleted: false
        })),
        isCompleted: false
      };

      curriculumPath.push(phase);
      phaseNumber++;
    }

    return curriculumPath;
  }

  private static async updateLessonProgress(
    curriculum: any,
    lessonId: string,
    score: number,
    timeSpent: number
  ) {
    // Find and update lesson in curriculum
    for (const phase of curriculum.curriculumPath) {
      const lesson = phase.lessons.find((l: any) => l.lessonId.toString() === lessonId);
      if (lesson && !lesson.isCompleted) {
        lesson.isCompleted = true;
        lesson.completedAt = new Date();
        lesson.score = score;
        lesson.timeSpent = timeSpent;

        curriculum.progress.lessonsCompleted += 1;
        break;
      }
    }

    // Check if current phase is completed
    await this.checkPhaseCompletion(curriculum);
  }

  private static async updateTestProgress(curriculum: any, testId: string, score: number) {
    // Find and update test in curriculum
    for (const phase of curriculum.curriculumPath) {
      const test = phase.tests.find((t: any) => t.testId.toString() === testId);
      if (test && !test.isCompleted) {
        test.isCompleted = true;
        test.completedAt = new Date();
        test.score = score;

        curriculum.progress.testsCompleted += 1;
        break;
      }
    }

    // Check if current phase is completed
    await this.checkPhaseCompletion(curriculum);
  }

  private static async checkPhaseCompletion(curriculum: any) {
    const currentPhase = curriculum.curriculumPath.find((p: any) => p.phase === curriculum.progress.currentPhase);
    
    if (currentPhase) {
      const allLessonsCompleted = currentPhase.lessons.every((l: any) => l.isCompleted);
      const allTestsCompleted = currentPhase.tests.every((t: any) => t.isCompleted);

      if (allLessonsCompleted && allTestsCompleted) {
        currentPhase.isCompleted = true;
        currentPhase.completedAt = new Date();

        // Move to next phase
        if (curriculum.progress.currentPhase < curriculum.curriculumPath.length) {
          curriculum.progress.currentPhase += 1;
        }

        // Add achievement
        curriculum.achievements.push({
          type: 'milestone',
          title: `${currentPhase.title} Completed`,
          description: `Successfully completed ${currentPhase.title}`,
          icon: '🎯',
          unlockedAt: new Date()
        });
      }
    }
  }

  private static async recalculateProgress(curriculum: any) {
    const totalLessons = curriculum.progress.totalLessons;
    const totalTests = curriculum.progress.totalTests;
    const completedLessons = curriculum.progress.lessonsCompleted;
    const completedTests = curriculum.progress.testsCompleted;

    const lessonProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const testProgress = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

    curriculum.progress.overallProgress = Math.round((lessonProgress + testProgress) / 2);

    // Estimate completion date
    const averageLessonsPerWeek = 5; // Assuming 5 lessons per week
    const remainingLessons = totalLessons - completedLessons;
    const weeksToComplete = Math.ceil(remainingLessons / averageLessonsPerWeek);
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));
    curriculum.progress.estimatedCompletionDate = completionDate;
  }

  private static async generateRecommendations(curriculum: any) {
    // Clear old recommendations
    curriculum.recommendations = [];

    // Get current phase
    const currentPhase = curriculum.curriculumPath.find((p: any) => p.phase === curriculum.progress.currentPhase);
    if (!currentPhase) return;

    // Recommend next incomplete lesson
    const nextLesson = currentPhase.lessons.find((l: any) => !l.isCompleted);
    if (nextLesson) {
      curriculum.recommendations.push({
        type: 'lesson',
        title: 'Continue Your Learning',
        description: 'Complete the next lesson in your curriculum',
        reason: 'Based on your current progress',
        priority: 'high',
        resourceId: nextLesson.lessonId,
        resourceType: 'lesson',
        isCompleted: false,
        createdAt: new Date()
      });
    }

    // Recommend practice if score is low
    const recentLessons = currentPhase.lessons.filter((l: any) => l.isCompleted && l.score < 70);
    if (recentLessons.length > 0) {
      curriculum.recommendations.push({
        type: 'practice',
        title: 'Practice Weak Areas',
        description: 'Review lessons where you scored below 70%',
        reason: 'Focus on improving your understanding',
        priority: 'medium',
        isCompleted: false,
        createdAt: new Date()
      });
    }

    // Recommend next test if all lessons are completed
    const allLessonsCompleted = currentPhase.lessons.every((l: any) => l.isCompleted);
    if (allLessonsCompleted) {
      const nextTest = currentPhase.tests.find((t: any) => !t.isCompleted);
      if (nextTest) {
        curriculum.recommendations.push({
          type: 'test',
          title: 'Take Assessment',
          description: 'Complete the level assessment',
          reason: 'All lessons completed for this phase',
          priority: 'high',
          resourceId: nextTest.testId,
          resourceType: 'test',
          isCompleted: false,
          createdAt: new Date()
        });
      }
    }
  }

  private static async getRecentAttempts(studentId: string) {
    // This would typically query LessonAttempt model
    // For now, return empty array
    return [];
  }

  private static async calculateSkillProgress(studentId: string) {
    const progress = await LessonProgress.find({ student: studentId });
    
    const skillProgress = {
      grammar: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      listening: 0,
      vocabulary: 0
    };

    progress.forEach(p => {
      Object.keys(p.skills).forEach(skill => {
        skillProgress[skill as keyof typeof skillProgress] = Math.max(
          skillProgress[skill as keyof typeof skillProgress],
          p.skills[skill as keyof typeof p.skills]
        );
      });
    });

    return skillProgress;
  }

  private static async calculateWeeklyProgress(studentId: string) {
    // This would calculate weekly progress from LessonAttempt model
    // For now, return sample data
    return {
      currentWeek: 15,
      lessonsCompleted: 3,
      timeSpent: 120,
      averageScore: 85
    };
  }
} 