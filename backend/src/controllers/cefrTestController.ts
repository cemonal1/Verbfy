import { Request, Response } from 'express';
import { CEFRTest } from '../models/CEFRTest';
import { LessonAttempt } from '../models/LessonAttempt';
import User from '../models/User';
import { PersonalizedCurriculum } from '../models/PersonalizedCurriculum';
import { AuthRequest } from '../middleware/auth';

export class CEFRTestController {
  // Get all tests
  static async getTests(req: Request, res: Response) {
    try {
      const { level, type, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = {};
      if (level) filter.cefrLevel = level;
      if (type) filter.testType = type;

      const tests = await CEFRTest.find(filter)
        .populate('createdBy', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await CEFRTest.countDocuments(filter);

      res.json({
        tests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching tests', error: error.message });
    }
  }

  // Get test by ID
  static async getTest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const test = await CEFRTest.findById(id)
        .populate('createdBy', 'name');

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      res.json(test);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching test', error: error.message });
    }
  }

  // Create new test (admin/teacher only)
  static async createTest(req: AuthRequest, res: Response) {
    try {
      const testData = req.body;
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      testData.createdBy = req.user.id;

      const test = new CEFRTest(testData);
      await test.save();

      res.status(201).json(test);
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating test', error: error.message });
    }
  }

  // Update test (admin/teacher only)
  static async updateTest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const test = await CEFRTest.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      res.json(test);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating test', error: error.message });
    }
  }

  // Delete test (admin/teacher only)
  static async deleteTest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const test = await CEFRTest.findByIdAndDelete(id);

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      res.json({ message: 'Test deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting test', error: error.message });
    }
  }

  // Start test attempt
  static async startTest(req: AuthRequest, res: Response) {
    try {
      const { testId } = req.params;
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;

      const test = await CEFRTest.findById(testId);
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Check if user has access to premium test
      if (test.isPremium) {
        const user = await User.findById(studentId);
        if (user?.subscriptionStatus !== 'active') {
          return res.status(403).json({ message: 'Premium test requires active subscription' });
        }
      }

      // Calculate total score
      const maxScore = test.sections.reduce((total, section) => {
        return total + section.questions.reduce((sectionTotal, question) => {
          return sectionTotal + question.points;
        }, 0);
      }, 0);

      // Create test attempt
      const attempt = new LessonAttempt({
        student: studentId,
        lessonType: 'cefr_test',
        lessonId: testId,
        startTime: new Date(),
        maxScore,
        status: 'in_progress'
      });

      await attempt.save();

      res.json({
        attemptId: attempt._id,
        test: {
          id: test._id,
          title: test.title,
          description: test.description,
          cefrLevel: test.cefrLevel,
          testType: test.testType,
          totalTime: test.totalTime,
          sections: test.sections.map(section => ({
            name: section.name,
            description: section.description,
            skill: section.skill,
            timeLimit: section.timeLimit,
            questions: section.questions.map((question, index) => ({
              index,
              type: question.type,
              question: question.question,
              options: question.options,
              points: question.points,
              audioUrl: question.audioUrl,
              imageUrl: question.imageUrl,
              difficulty: question.difficulty
            }))
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error starting test', error: error.message });
    }
  }

  // Submit test attempt
  static async submitTest(req: AuthRequest, res: Response) {
    try {
      const { attemptId } = req.params;
      const { answers, timeSpent } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const attempt = await LessonAttempt.findById(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: 'Attempt not found' });
      }

      if (attempt.student.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const test = await CEFRTest.findById(attempt.lessonId);
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Calculate score and process answers
      let totalScore = 0;
      const processedAnswers = answers.map((answer: any) => {
        const question = this.findQuestion(test, answer.sectionIndex, answer.questionIndex);
        const isCorrect = this.checkAnswer(answer.studentAnswer, question.correctAnswer);
        const points = isCorrect ? question.points : 0;
        totalScore += points;

        return {
          questionIndex: answer.questionIndex,
          question: question.question,
          studentAnswer: answer.studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points,
          maxPoints: question.points,
          timeSpent: answer.timeSpent || 0
        };
      });

      const finalScore = Math.round((totalScore / attempt.maxScore) * 100);
      const isPassed = finalScore >= test.passingScore;

      // Calculate skill scores
      const skillScores = this.calculateSkillScores(test, processedAnswers);

      // Update attempt
      attempt.answers = processedAnswers;
      attempt.score = finalScore;
      attempt.timeSpent = timeSpent;
      attempt.completedAt = new Date();
      attempt.isCompleted = true;
      attempt.isPassed = isPassed;
      attempt.skills = skillScores;
      attempt.feedback = this.generateTestFeedback(test, processedAnswers, finalScore);

      await attempt.save();

      // Update user's CEFR level if this is a placement test
      if (test.testType === 'placement' && isPassed) {
        await this.updateUserCEFRLevel(req.user.id, test.cefrLevel, skillScores);
      }

      // Update personalized curriculum if exists
      await this.updatePersonalizedCurriculum(req.user.id, test, finalScore, skillScores);

      res.json({
        score: finalScore,
        maxScore: attempt.maxScore,
        isPassed,
        cefrLevel: test.cefrLevel,
        feedback: attempt.feedback,
        skillScores
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting test', error: error.message });
    }
  }

  // Get placement test recommendations
  static async getPlacementRecommendation(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const studentId = req.user.id;

      // Get user's recent test attempts
      const recentAttempts = await LessonAttempt.find({
        student: studentId,
        lessonType: 'cefr_test',
        isCompleted: true
      })
      .sort({ completedAt: -1 })
      .limit(5);

      if (recentAttempts.length === 0) {
        // No previous tests, recommend A1 placement test
        const a1Test = await CEFRTest.findOne({
          cefrLevel: 'A1',
          testType: 'placement',
          isActive: true,
          isPremium: false
        });

        return res.json({
          recommendedLevel: 'A1',
          test: a1Test,
          reason: 'No previous test history found'
        });
      }

      // Calculate average score and recommend next level
      const averageScore = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length;
      const lastTest = recentAttempts[0];
      const currentLevel = lastTest.cefrLevel;

      let recommendedLevel = currentLevel;
      if (averageScore >= 85) {
        recommendedLevel = this.getNextLevel(currentLevel);
      } else if (averageScore < 60) {
        recommendedLevel = this.getPreviousLevel(currentLevel);
      }

      const recommendedTest = await CEFRTest.findOne({
        cefrLevel: recommendedLevel,
        testType: 'placement',
        isActive: true
      });

      res.json({
        recommendedLevel,
        test: recommendedTest,
        reason: `Based on average score of ${Math.round(averageScore)}% from recent tests`,
        recentAttempts: recentAttempts.map(attempt => ({
          cefrLevel: attempt.cefrLevel,
          score: attempt.score,
          completedAt: attempt.completedAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error getting placement recommendation', error: error.message });
    }
  }

  // Get test statistics
  static async getTestStats(req: Request, res: Response) {
    try {
      const { testId } = req.params;

      const stats = await LessonAttempt.aggregate([
        { $match: { testId: testId, isCompleted: true } },
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
      res.status(500).json({ message: 'Error fetching test stats', error: error.message });
    }
  }

  // Helper methods
  private static findQuestion(test: any, sectionIndex: number, questionIndex: number) {
    return test.sections[sectionIndex].questions[questionIndex];
  }

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

  private static calculateSkillScores(test: any, answers: any[]) {
    const skillScores = {
      grammar: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      listening: 0,
      vocabulary: 0
    };

    // Group answers by skill and calculate scores
    const skillGroups: any = {};
    test.sections.forEach((section: any, sectionIndex: number) => {
      if (!skillGroups[section.skill]) {
        skillGroups[section.skill] = [];
      }
      
      section.questions.forEach((question: any, questionIndex: number) => {
        const answer = answers.find(a => 
          a.questionIndex === questionIndex && 
          test.sections[sectionIndex].questions[questionIndex].question === a.question
        );
        
        if (answer) {
          skillGroups[section.skill].push({
            points: answer.points,
            maxPoints: answer.maxPoints
          });
        }
      });
    });

    // Calculate skill scores
    Object.keys(skillGroups).forEach(skill => {
      const skillAnswers = skillGroups[skill];
      if (skillAnswers.length > 0) {
        const totalPoints = skillAnswers.reduce((sum: number, a: any) => sum + a.points, 0);
        const maxPoints = skillAnswers.reduce((sum: number, a: any) => sum + a.maxPoints, 0);
        skillScores[skill as keyof typeof skillScores] = Math.round((totalPoints / maxPoints) * 100);
      }
    });

    return skillScores;
  }

  private static generateTestFeedback(test: any, answers: any[], score: number) {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAnswers = answers.length;
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];

    if (score >= 90) {
      strengths.push('Excellent performance across all skills');
      recommendations.push(`Consider taking ${this.getNextLevel(test.cefrLevel)} level tests`);
    } else if (score >= 70) {
      strengths.push('Good overall performance');
      recommendations.push('Focus on areas with lower scores');
      recommendations.push('Practice with targeted exercises');
    } else {
      areasForImprovement.push('Need more practice with current level');
      recommendations.push('Review fundamental concepts');
      recommendations.push('Take more practice tests');
    }

    return {
      overall: `You scored ${score}% on the ${test.cefrLevel} ${test.testType} test. ${score >= test.passingScore ? 'Congratulations! You passed!' : 'Keep practicing to improve your skills.'}`,
      strengths,
      areasForImprovement,
      recommendations
    };
  }

  private static async updateUserCEFRLevel(userId: string, cefrLevel: string, skillScores: any) {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.cefrLevel = cefrLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
        
        // Update overall progress based on skill scores
        if (!user.overallProgress) {
          user.overallProgress = {
            grammar: 0,
            reading: 0,
            writing: 0,
            speaking: 0,
            listening: 0,
            vocabulary: 0
          };
        }

        // Update progress with new skill scores
        Object.keys(skillScores).forEach(skill => {
          if (user.overallProgress) {
            const currentScore = user.overallProgress[skill as keyof typeof user.overallProgress];
            user.overallProgress[skill as keyof typeof user.overallProgress] = 
              Math.round((currentScore + skillScores[skill]) / 2);
          }
        });

        await user.save();
      }
    } catch (error: any) {
      console.error('Error updating user CEFR level:', error);
    }
  }

  private static async updatePersonalizedCurriculum(userId: string, test: any, score: number, skillScores: any) {
    try {
      let curriculum = await PersonalizedCurriculum.findOne({ student: userId });
      
      if (curriculum) {
        // Update current CEFR level if placement test
        if (test.testType === 'placement' && score >= test.passingScore) {
          curriculum.currentCEFRLevel = test.cefrLevel;
        }

        // Update learning goals based on skill scores
        curriculum.learningGoals.forEach(goal => {
          const skillScore = skillScores[goal.skill];
          if (skillScore !== undefined) {
            goal.currentLevel = skillScore;
          }
        });

        await curriculum.save();
      }
    } catch (error: any) {
      console.error('Error updating personalized curriculum:', error);
    }
  }

  private static getNextLevel(currentLevel: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    const levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel as any);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel as any;
  }

  private static getPreviousLevel(currentLevel: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    const levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel as any);
    return currentIndex > 0 ? levels[currentIndex - 1] : currentLevel as any;
  }
} 