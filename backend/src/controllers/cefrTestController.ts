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
      const { level, type, testType, page = 1, limit = 10 } = req.query as any;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = {};
      if (level) filter.cefrLevel = level;
      if (type || testType) filter.testType = type || testType;

      const tests = await CEFRTest.find(filter)
        .populate('createdBy', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      let total = await CEFRTest.countDocuments(filter);

      // If client requests placement tests and none exist, attempt a lightweight bootstrap (no auth required)
      if ((type === 'placement' || testType === 'placement') && total === 0) {
        try {
          const admin = await (await import('../models/User')).default.findOne({ role: 'admin' }).lean();
          const fakeReq: any = { user: { id: admin?._id?.toString?.() || '000000000000000000000000' } };
          const fakeRes: any = { status: () => fakeRes, json: () => ({}) };
          // Seed a minimal set to ensure public availability
          await CEFRTestController.seedGlobalPlacementTest(fakeReq, fakeRes);
          await CEFRTestController.seedKidsPlacementA1B1(fakeReq, fakeRes);
          await CEFRTestController.seedAdultsPlacementA1B2(fakeReq, fakeRes);
          await CEFRTestController.seedAdvancedPlacementB1C2(fakeReq, fakeRes);
          // Re-query after seeding
          const seeded = await CEFRTest.find(filter)
            .populate('createdBy', 'name')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
          tests.splice(0, tests.length, ...seeded as any);
          total = await CEFRTest.countDocuments(filter);
        } catch (_) {}
      }

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

  // Public bootstrap seed (idempotent). Safer path that will only seed if none exist.
  static async bootstrapPublicSeeds(_req: Request, res: Response) {
    try {
      const existingCount = await CEFRTest.countDocuments({ testType: 'placement' });
      if (existingCount > 0) {
        return res.json({ created: false, message: 'Placement tests already exist' });
      }
      const UserModel = (await import('../models/User')).default;
      const admin = await UserModel.findOne({ role: 'admin' }).lean();
      const fakeReq: any = { user: { id: admin?._id?.toString?.() || '000000000000000000000000' } };
      const fakeRes: any = { status: () => fakeRes, json: () => ({}) };
      await CEFRTestController.seedGlobalPlacementTest(fakeReq, fakeRes);
      await CEFRTestController.seedKidsPlacementA1B1(fakeReq, fakeRes);
      await CEFRTestController.seedAdultsPlacementA1B2(fakeReq, fakeRes);
      await CEFRTestController.seedAdvancedPlacementB1C2(fakeReq, fakeRes);
      return res.status(201).json({ created: true });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error bootstrapping placement tests', error: error.message });
    }
  }

  // Public list: ensure 4 placement tests exist then return all placement tests
  static async listOrSeedPlacement(req: Request, res: Response) {
    try {
      const titles = [
        'Global CEFR Placement (50Q)',
        'Kids Placement (A1–B1) – 40Q',
        'Adults Placement (A1–B2) – 60Q',
        'Advanced Placement (B1–C2) – 60Q'
      ];
      const existing = await CEFRTest.find({ testType: 'placement' }).select('title').lean();
      const have = new Set(existing.map((t: any) => t.title));
      if (titles.some(t => !have.has(t))) {
        const UserModel = (await import('../models/User')).default;
        const admin = await UserModel.findOne({ role: 'admin' }).lean();
        const fakeReq: any = { user: { id: admin?._id?.toString?.() || '000000000000000000000000' } };
        const fakeRes: any = { status: () => fakeRes, json: () => ({}) };
        if (!have.has('Global CEFR Placement (50Q)')) await CEFRTestController.seedGlobalPlacementTest(fakeReq, fakeRes);
        if (!have.has('Kids Placement (A1–B1) – 40Q')) await CEFRTestController.seedKidsPlacementA1B1(fakeReq, fakeRes);
        if (!have.has('Adults Placement (A1–B2) – 60Q')) await CEFRTestController.seedAdultsPlacementA1B2(fakeReq, fakeRes);
        if (!have.has('Advanced Placement (B1–C2) – 60Q')) await CEFRTestController.seedAdvancedPlacementB1C2(fakeReq, fakeRes);
      }
      const tests = await CEFRTest.find({ testType: 'placement' })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ tests });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error listing placement tests', error: error.message });
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
          timed: (test as any).timed !== false,
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

      // Placement decision (overall + tie-break by sections + anti-guessing streak)
      let recommendedLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1';
      let totalCorrect = processedAnswers.filter(a => a.isCorrect).length;

      // Compute per-section correct counts by global index ranges
      const sectionLengths = test.sections.map((s: any) => s.questions.length);
      const sectionStarts: number[] = [];
      sectionLengths.reduce((acc: number, len: number, idx: number) => {
        sectionStarts[idx] = acc;
        return acc + len;
      }, 0);

      const isCorrectByGlobal: boolean[] = new Array(sectionLengths.reduce((a: number, b: number) => a + b, 0)).fill(false);
      processedAnswers.forEach((a: any) => {
        const g = sectionStarts[a.sectionIndex] + a.questionIndex; // 0-based
        isCorrectByGlobal[g] = a.isCorrect;
      });

      const countRangeCorrect = (start1Based: number, end1Based: number) => {
        let c = 0;
        for (let i = start1Based - 1; i <= end1Based - 1; i++) {
          if (isCorrectByGlobal[i]) c++;
        }
        return c;
      };

      const grammarUse = countRangeCorrect(1, 20);
      const vocabulary = countRangeCorrect(21, 30);
      const reading = countRangeCorrect(31, 40);
      const advanced = countRangeCorrect(41, 50);

      // Base level from overall correct
      const baseFromOverall = (correct: number): typeof recommendedLevel => {
        if (correct <= 10) return 'A1';
        if (correct <= 20) return 'A2';
        if (correct <= 30) return 'B1';
        if (correct <= 40) return 'B2';
        if (correct <= 46) return 'C1';
        return 'C2';
      };
      recommendedLevel = baseFromOverall(totalCorrect);

      // Tie-break promotion on exact boundaries
      const promoteIf = (neededSignals: number, signals: boolean[], target: typeof recommendedLevel) => {
        const count = signals.reduce((s, b) => s + (b ? 1 : 0), 0);
        if (count >= neededSignals) recommendedLevel = target;
      };

      if (totalCorrect === 10) {
        const signals = [reading > 4, grammarUse > 10, vocabulary > 4, advanced > 3];
        promoteIf(2, signals, 'A2');
      } else if (totalCorrect === 20) {
        const signals = [reading > 4, grammarUse >= 11, vocabulary >= 5, advanced >= 4];
        promoteIf(2, signals, 'B1');
      } else if (totalCorrect === 30) {
        const signals = [reading >= 8, grammarUse >= 17, vocabulary >= 8, advanced >= 4];
        promoteIf(2, signals, 'B2');
      } else if (totalCorrect === 40) {
        const signals = [reading >= 8, grammarUse >= 17, vocabulary >= 8, advanced >= 7];
        promoteIf(2, signals, 'C1');
      }

      // Anti-guessing: degrade one level if >=6 consecutive wrong/blank
      let longestWrongStreak = 0;
      let streak = 0;
      for (let i = 0; i < isCorrectByGlobal.length; i++) {
        if (isCorrectByGlobal[i]) streak = 0; else { streak++; longestWrongStreak = Math.max(longestWrongStreak, streak); }
      }
      const downgrade = (lvl: typeof recommendedLevel): typeof recommendedLevel => {
        const order: typeof recommendedLevel[] = ['A1','A2','B1','B2','C1','C2'];
        const idx = order.indexOf(lvl);
        return idx > 0 ? order[idx-1] : lvl;
      };
      const hasLongWrongStreak = longestWrongStreak >= 6;
      if (hasLongWrongStreak) {
        recommendedLevel = downgrade(recommendedLevel);
      }

      // If this test has a scoringRubric, map total correct to rubric level
      if ((test as any).scoringRubric && Array.isArray((test as any).scoringRubric)) {
        const rubric = (test as any).scoringRubric as { min:number; max:number; level:any }[];
        const match = rubric.find(r => totalCorrect >= r.min && totalCorrect <= r.max);
        if (match) recommendedLevel = match.level;
      }

      // Persist placement result to user profile
      if (test.testType === 'placement') {
        await this.updateUserCEFRLevel(req.user.id, recommendedLevel, skillScores);
      }

      // Update personalized curriculum if exists
      await this.updatePersonalizedCurriculum(req.user.id, test, finalScore, skillScores);

      res.json({
        score: finalScore,
        maxScore: attempt.maxScore,
        totalCorrect,
        isPassed,
        recommendedLevel,
        sectionScores: { grammarUse, vocabulary, reading, advanced },
        tieBreakApplied: [10,20,30,40].includes(totalCorrect),
        hasLongWrongStreak,
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

  // Seed: Create a 50-question global CEFR placement test (admin only)
  static async seedGlobalPlacementTest(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const existing = await CEFRTest.findOne({ title: 'Global CEFR Placement (50Q)' });
      if (existing) {
        return res.json({ created: false, test: existing });
      }

      // Helpers to build questions
      const mc = (
        question: string,
        options: string[],
        correct: string,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
      ) => ({ type: 'multiple-choice', question, options, correctAnswer: correct, explanation: '', points: 1, difficulty });

      const fb = (
        question: string,
        correct: string,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
      ) => ({ type: 'fill-blank', question, correctAnswer: correct, explanation: '', points: 1, difficulty });

      // Section 1: Grammar Basics (10 MC)
      const sectionGrammarBasics = {
        name: 'Grammar Basics',
        description: 'Fundamental English grammar structures.',
        skill: 'grammar' as const,
        timeLimit: 12,
        questions: [
          mc('I ____ to school every day.', ['go', 'goes', 'going', 'gone'], 'go', 'easy'),
          mc('She ____ from Turkey.', ['is', 'are', 'am', 'be'], 'is', 'easy'),
          mc('They ____ football yesterday.', ['play', 'plays', 'played', 'playing'], 'played', 'easy'),
          mc('We have ____ our homework.', ['do', 'did', 'done', 'doing'], 'done', 'medium'),
          mc('If I ____ time, I will help you.', ['have', 'had', 'will have', 'am having'], 'have', 'medium'),
          mc('He ____ for two hours.', ['has studied', 'studied', 'is study', 'have studied'], 'has studied', 'medium'),
          mc('The book ____ by John.', ['was written', 'wrote', 'is write', 'has write'], 'was written', 'medium'),
          mc('She is ____ than her sister.', ['tall', 'taller', 'the tallest', 'most tall'], 'taller', 'easy'),
          mc('I wish I ____ more time.', ['have', 'had', 'will have', 'am having'], 'had', 'medium'),
          mc('You ____ smoke here.', ['must not', 'don’t have to', 'should to', 'can to'], 'must not', 'medium')
        ]
      };

      // Section 2: Vocabulary Essentials (10 MC)
      const sectionVocab = {
        name: 'Vocabulary Essentials',
        description: 'Common everyday words and phrases.',
        skill: 'vocabulary' as const,
        timeLimit: 10,
        questions: [
          mc('Choose the synonym of "rapid".', ['slow', 'quick', 'late', 'small'], 'quick', 'easy'),
          mc('Choose the antonym of "increase".', ['rise', 'grow', 'reduce', 'add'], 'reduce', 'easy'),
          mc('He gave a very ____ explanation.', ['clear', 'clearly', 'clarity', 'clarify'], 'clear', 'medium'),
          mc('The meeting was ____ due to the storm.', ['canceled', 'created', 'visited', 'covered'], 'canceled', 'easy'),
          mc('Pick the best word: She has a ____ for languages.', ['talent', 'tall', 'tale', 'tablet'], 'talent', 'easy'),
          mc('Select the correct collocation: make a ____', ['decision', 'homework', 'photo', 'walk'], 'decision', 'medium'),
          mc('Which word fits: highly ____', ['likely', 'alike', 'lightly', 'lively'], 'likely', 'medium'),
          mc('Closest meaning to "assist".', ['help', 'hide', 'hold', 'hope'], 'help', 'easy'),
          mc('Opposite of "difficult".', ['hard', 'complex', 'easy', 'complicated'], 'easy', 'easy'),
          mc('Choose the best phrase: in ____ of', ['case', 'cause', 'curse', 'cave'], 'case', 'medium')
        ]
      };

      // Section 3: Reading Comprehension (10 MC)
      const sectionReading = {
        name: 'Reading Comprehension',
        description: 'Short texts and comprehension questions.',
        skill: 'reading' as const,
        timeLimit: 14,
        questions: [
          mc('Text: Tom works from 9 to 5. Question: When does Tom start work?', ['At 5', 'At 9', 'At 7', 'At noon'], 'At 9', 'easy'),
          mc('Text: The museum is closed on Mondays. Question: Which day is it closed?', ['Sunday', 'Monday', 'Tuesday', 'Friday'], 'Monday', 'easy'),
          mc('Text: Sarah prefers tea to coffee. Question: What does Sarah prefer?', ['Tea', 'Coffee', 'Neither', 'Both'], 'Tea', 'easy'),
          mc('Text: The train was delayed due to fog. Question: Why was it delayed?', ['Strike', 'Fog', 'Accident', 'Snow'], 'Fog', 'medium'),
          mc('Text: Entry is free for children under 6. Question: Who can enter free?', ['Adults', 'Seniors', 'Children <6', 'Students'], 'Children <6', 'easy'),
          mc('Text: The concert starts at 8 pm. Question: What time does it start?', ['6 pm', '7 pm', '8 pm', '9 pm'], '8 pm', 'easy'),
          mc('Text: Bring your ID to register. Question: What must you bring?', ['Ticket', 'ID', 'Money', 'Book'], 'ID', 'easy'),
          mc('Text: The library opens earlier in summer. Question: When does it open?', ['Later', 'Earlier', 'Never', 'Same time'], 'Earlier', 'medium'),
          mc('Text: Parking is prohibited. Question: Can you park?', ['Yes', 'No', 'Only at night', 'On weekends'], 'No', 'medium'),
          mc('Text: The cafe offers vegan options. Question: What is offered?', ['Vegan food', 'Only meat', 'No drinks', 'Only desserts'], 'Vegan food', 'easy')
        ]
      };

      // Section 4: Use of English (Gap-fill) (10 Fill-blank)
      const sectionUseOfEnglish = {
        name: 'Use of English',
        description: 'Grammar and vocabulary gap-fill.',
        skill: 'grammar' as const,
        timeLimit: 12,
        questions: [
          fb('Complete: She ____ (to be) very kind.', 'is', 'easy'),
          fb('Complete: They ____ (to go) to school by bus.', 'go', 'easy'),
          fb('Complete: I have ____ (already) finished.', 'already', 'medium'),
          fb('Complete: We ____ (not) seen him.', "haven't", 'medium'),
          fb('Complete: It depends ____ the weather.', 'on', 'medium'),
          fb('Complete: I look forward ____ you.', 'to seeing', 'hard'),
          fb('Complete: If I ____ rich, I would travel.', 'were', 'hard'),
          fb('Complete: She is interested ____ art.', 'in', 'easy'),
          fb('Complete: The movie was ____ (excite).', 'exciting', 'medium'),
          fb('Complete: He has lived here ____ 2015.', 'since', 'medium')
        ]
      };

      // Section 5: Mixed Review (10 MC)
      const sectionMixed = {
        name: 'Mixed Review',
        description: 'Mixed grammar, vocab, and reading items.',
        skill: 'reading' as const,
        timeLimit: 12,
        questions: [
          mc('Choose the correct form: I ____ dinner now.', ['am cooking', 'cook', 'cooked', 'cooks'], 'am cooking', 'easy'),
          mc('Select the best option: She ____ to the gym twice a week.', ['go', 'goes', 'is go', 'gone'], 'goes', 'easy'),
          mc('Find the error: She don’t like coffee.', ['She', 'don’t', 'like', 'coffee'], 'don’t', 'medium'),
          mc('Pick the right preposition: proud ____ you', ['for', 'to', 'of', 'on'], 'of', 'medium'),
          mc('Which is formal?: I would appreciate your help.', ['I need help.', 'Help me.', 'I would appreciate your help.', 'Can you help?'], 'I would appreciate your help.', 'medium'),
          mc('Right order: rarely / we / watch / TV', ['We rarely watch TV', 'Rarely watch we TV', 'We watch rarely TV', 'Watch we rarely TV'], 'We rarely watch TV', 'medium'),
          mc('Closest meaning to "assist":', ['avoid', 'allow', 'help', 'wear'], 'help', 'easy'),
          mc('Choose the correct tense: By 2030, I ____ my degree.', ['finish', 'will finish', 'will have finished', 'finished'], 'will have finished', 'hard'),
          mc('Conditional II: If I ____ you, I would rest.', ['am', 'was', 'were', 'be'], 'were', 'hard'),
          mc('Reported speech: He said he ____ tired.', ['is', 'was', 'were', 'be'], 'was', 'medium')
        ]
      };

      const sections = [sectionGrammarBasics, sectionVocab, sectionReading, sectionUseOfEnglish, sectionMixed];
      const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
      const totalTime = sections.reduce((sum, s) => sum + s.timeLimit, 0);

      const test = await CEFRTest.create({
        title: 'Global CEFR Placement (50Q)',
        description: 'A comprehensive 50-question placement test covering grammar, vocabulary and reading to estimate your CEFR level.',
        cefrLevel: 'A1',
        testType: 'placement',
        timed: false,
        sections,
        totalQuestions,
        totalTime,
        passingScore: 60,
        isActive: true,
        isPremium: false,
        createdBy: req.user.id
      });

      return res.status(201).json({ created: true, test });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error seeding global placement test', error: error.message });
    }
  }

  // Seed: Kids A1–B1 Placement (untimed, kid-friendly topics)
  static async seedKidsPlacementA1B1(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'User not authenticated' });
      const existing = await CEFRTest.findOne({ title: 'Kids Placement (A1–B1) – 40Q' });
      if (existing) return res.json({ created: false, test: existing });

      const mc = (q: string, options: string[], correct: string, diff: 'easy'|'medium'|'hard' = 'easy') => ({ type: 'multiple-choice', question: q, options, correctAnswer: correct, points: 1, difficulty: diff });

      const section1 = { name: 'Kids Grammar A1', description: 'Basic be/do/have; singular-plural; simple present', skill: 'grammar' as const, timeLimit: 10, questions: [
        mc('How old ___ you?', ['are','is','am','be'], 'are'),
        mc('She ___ tennis every Sunday.', ['play','plays','playing','played'], 'plays'),
        mc('___ the children playing?', ['Is','Are','Do','Does'], 'Are'),
        mc('There ___ a cat under the table.', ['is','are','have','has'], 'is'),
        mc('I have two ___.', ['cat','cats','cat’s','cates'], 'cats'),
        mc('They ___ going to the park now.', ['is','am','are','be'], 'are'),
        mc('This book belongs ___ Sarah.', ['on','to','with','at'], 'to'),
        mc('Tom ___ football in the afternoon.', ['playing','plays','is playing','play'], 'plays')
      ]};

      const section2 = { name: 'Everyday Vocabulary', description: 'Food, school, colors, animals', skill: 'vocabulary' as const, timeLimit: 10, questions: [
        mc('Which word names a fruit?', ['car','apple','chair','cat'], 'apple'),
        mc('Which is a vegetable?', ['Banana','Carrot','Apple','Strawberry'], 'Carrot'),
        mc('What is the color of grass?', ['Red','Yellow','Green','Blue'], 'Green'),
        mc('Which animal can fly?', ['Elephant','Sparrow','Dog','Horse'], 'Sparrow'),
        mc('Which item is not found in a school?', ['Desk','Board','Refrigerator','Chair'], 'Refrigerator')
      ]};

      const section3 = { name: 'Kids Reading A1', description: 'Short facts and questions', skill: 'reading' as const, timeLimit: 10, questions: [
        mc('Read: John has a red car. Q: What color is John\'s car?', ['Red','Blue','Green','Yellow'], 'Red'),
        mc('Read: Emma eats an apple and a banana. Q: What does she eat?', ['Apple','Bananas','Apple and banana','Orange'], 'Apple and banana'),
        mc('Read: Mike is in the garden. Q: Where is Mike?', ['House','Garden','School','Market'], 'Garden')
      ]};

      const section4 = { name: 'Kids A2–B1 Bridge', description: 'Past/future basics and common phrases', skill: 'grammar' as const, timeLimit: 10, questions: [
        mc('I ___ to the park yesterday.', ['go','goes','went','going'], 'went', 'medium'),
        mc('If it rains tomorrow, I ___ at home.', ['will stay','stays','stayed','stay'], 'will stay', 'medium'),
        mc('She ___ her homework before TV.', ['finished','had finished','has finished','finishes'], 'had finished', 'medium'),
        mc('By next year, I ___ my exam.', ['will have finished','finish','have finished','will finish'], 'will have finished', 'hard'),
        mc('Tom has been ___ math teacher for five years.', ['teaches','teaching','teach','taught'], 'teaching', 'medium')
      ]};

      const sections = [section1, section2, section3, section4];
      const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);
      const totalTime = sections.reduce((s, sec) => s + sec.timeLimit, 0);
      const test = await CEFRTest.create({
        title: 'Kids Placement (A1–B1) – 40Q',
        description: 'Çocuklara uygun A1–B1 yerleştirme: günlük yaşam bağlamları, temel dilbilgisi ve kısa okuma soruları. Zaman sınırı yoktur.',
        cefrLevel: 'A1',
        testType: 'placement',
        timed: false,
        sections,
        totalQuestions,
        totalTime,
        passingScore: 60,
        isActive: true,
        isPremium: false,
        createdBy: req.user.id
      });
      return res.status(201).json({ created: true, test });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error seeding kids placement test', error: error.message });
    }
  }

  // Seed: Adults A1–B2 Placement (untimed, adult topics)
  static async seedAdultsPlacementA1B2(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'User not authenticated' });
      const existing = await CEFRTest.findOne({ title: 'Adults Placement (A1–B2) – 60Q' });
      if (existing) return res.json({ created: false, test: existing });

      const mc = (q: string, options: string[], correct: string, diff: 'easy'|'medium'|'hard' = 'medium') => ({ type: 'multiple-choice', question: q, options, correctAnswer: correct, points: 1, difficulty: diff });

      // Assemble questions from the provided adults set (representative subset across sections)
      const g1 = [
        mc('I usually ___ coffee in the morning.', ['drink','drinks','am drinking','drank'], 'drink', 'easy'),
        mc('She ___ to the gym every day.', ['go','goes','going','gone'], 'goes', 'easy'),
        mc('They ___ in France last year.', ['were','was','are','have been'], 'were', 'easy'),
        mc('I ___ my homework before I watched TV.', ['finished','had finished','have finished','finishes'], 'had finished', 'medium'),
        mc('By the end of this month, I ___ here for a year.', ['will work','worked','will have worked','have worked'], 'will have worked', 'hard'),
        mc('If I ___ more money, I would travel.', ['will have','had','had had','have'], 'had', 'medium'),
        mc('She asked me where ___ from.', ['I was','I were','was I','am I'], 'I was', 'medium'),
        mc('It’s high ___ we started.', ['time','noon','evening','hour'], 'time', 'easy'),
        mc('Neither the manager ___ the staff were available.', ['nor','or','and','but'], 'nor', 'medium'),
        mc('The movie was ___ boring that I fell asleep.', ['such','so','very','too'], 'so', 'easy')
      ];

      const v1 = [
        mc('This is a ___ day; let’s go for a walk.', ['sunny','rain','hot','swimming'], 'sunny', 'easy'),
        mc('He was ___ by the size of the crowd.', ['surprising','surprised','surprise','surprise'], 'surprised', 'easy'),
        mc('They managed to solve the problem, ___ of some difficulties.', ['inspite','despite','although','though'], 'despite', 'medium'),
        mc('We need to ___ the decision carefully.', ['take','make','do','make up'], 'make', 'easy'),
        mc('Her English is ___ better than mine.', ['much','many','more','so'], 'much', 'easy')
      ];

      const r1 = [
        mc('Read: Jane gave Tom a book. Q: What did Jane give Tom?', ['A toy','A car','A book','Money'], 'A book', 'easy'),
        mc('Read: They have lived in Rome ___ ten years.', ['since','for','during','from'], 'for', 'medium'),
        mc('Read: The meeting ___ at 3 PM tomorrow.', ['is','starts','will start','start'], 'will start', 'medium'),
        mc('Read: Mark is better at math than his brother. Q: Who is better?', ['Mark','His brother','Both','Unknown'], 'Mark', 'easy'),
        mc('Read: Our flight has been delayed by an hour. Q: Delay time?', ['30m','1h','2h','No delay'], '1h', 'easy')
      ];

      const adv = [
        mc('No sooner had he arrived ___ he got a phone call.', ['when','than','that','as soon as'], 'than', 'hard'),
        mc('Hardly had she left ___ the door rang.', ['when','than','that','as soon as'], 'when', 'hard'),
        mc('I suggest that he ___ to the doctor.', ['goes','go','will go','went'], 'go', 'medium'),
        mc('I was wondering if you ___ me with this task.', ['could help','can help','will help','helps'], 'could help', 'medium'),
        mc('It’s essential ___ aware of your surroundings.', ['to','be','being','that be'], 'to', 'medium')
      ];

      // Build sections (A1→B2 progressive)
      const sections = [
        { name: 'Adults Grammar A1–A2', description: 'Present/past basics, question forms', skill: 'grammar' as const, timeLimit: 12, questions: g1 },
        { name: 'Adults Vocabulary/Usage', description: 'Common lexis and collocation', skill: 'vocabulary' as const, timeLimit: 10, questions: v1 },
        { name: 'Adults Reading', description: 'Short reading items', skill: 'reading' as const, timeLimit: 12, questions: r1 },
        { name: 'Advanced Structures (B1–B2)', description: 'Inversion, subjunctive, cohesion', skill: 'grammar' as const, timeLimit: 12, questions: adv }
      ];

      const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);
      const totalTime = sections.reduce((s, sec) => s + sec.timeLimit, 0);
      const test = await CEFRTest.create({
        title: 'Adults Placement (A1–B2) – 60Q',
        description: 'Yetişkinler için A1–B2 yerleştirme: günlük yaşam, iş/seyahat bağlamları; dilbilgisi, kelime ve kısa okuma. Zaman sınırı yoktur.',
        cefrLevel: 'A1',
        testType: 'placement',
        timed: false,
        scoringRubric: [
          { min: 0, max: 29, level: 'B1' },
          { min: 30, max: 44, level: 'B2' },
          { min: 45, max: 55, level: 'C1' },
          { min: 56, max: 60, level: 'C2' },
        ],
        sections,
        totalQuestions,
        totalTime,
        passingScore: 60,
        isActive: true,
        isPremium: false,
        createdBy: req.user.id
      });
      return res.status(201).json({ created: true, test });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error seeding adults placement test', error: error.message });
    }
  }

  // Seed: Advanced Placement (B1–C2) – 60Q
  static async seedAdvancedPlacementB1C2(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'User not authenticated' });
      const existing = await CEFRTest.findOne({ title: 'Advanced Placement (B1–C2) – 60Q' });
      if (existing) return res.json({ created: false, test: existing });

      const mc = (q: string, options: string[], correct: string, diff: 'easy'|'medium'|'hard' = 'medium') => ({ type: 'multiple-choice', question: q, options, correctAnswer: correct, points: 1, difficulty: diff });

      // Use representative items across Grammar, Vocabulary, Reading, Use of English, Paraphrase
      const grammar = [
        mc('If she _______ harder, she would have passed the exam.', ['had studied','has studied','studied','will study'], 'had studied', 'hard'),
        mc('The report ________ be completed by next Monday.', ['should','must','may','can'], 'should', 'medium'),
        mc('Not only __________ the task in time, but we also improved the result.', ['we finished','did we finish','we did finish','we had finished'], 'did we finish', 'hard'),
        mc('The new app is _________ to thousands of users every week.', ['download','downloading','downloaded','to download'], 'downloaded', 'medium')
      ];
      const vocab = [
        mc('Select the word closest in meaning to "obtain":', ['lose','acquire','omit','deprive'], 'acquire', 'medium'),
        mc('We need to put a _______ on the spending.', ['cap','top','boundary','loop'], 'cap', 'medium'),
        mc('He gave up smoking last year. "Gave up" means:', ['started','stopped','reduced','postponed'], 'stopped', 'easy')
      ];
      const reading1 = [
        mc('Heatwave passage: cities measure?', ['pools','cooling centres','remove AC','lower buildings'], 'cooling centres', 'easy'),
        mc('Heatwave passage: scientists warn?', ['decrease','no effect','worsen without action','centres unnecessary'], 'worsen without action', 'medium'),
        mc('Heatwave passage: best summary?', ['unaffected','need steps to prevent worse heatwaves','water scarce only','scientists solved'], 'need steps to prevent worse heatwaves', 'medium')
      ];
      const use = [
        mc('He is fully _____ favour of the proposal.', ['in','on','for','to'], 'in', 'easy'),
        mc('They haven\'t _____ their tickets yet.', ['booked','buying','buy','had bought'], 'booked', 'easy'),
        mc('I wish I ________ the chance to travel when I was younger.', ['had','have had','have','had had'], 'had had', 'hard'),
        mc('We have ________ all possibilities but still cannot solve this issue.', ['exhausted','implemented','expanded','established'], 'exhausted', 'medium')
      ];
      const paraphrase = [
        mc('She regretted not attending the meeting.', ['She was sorry she hadn’t gone.','She wanted to skip.','She was happy she didn’t go.','She couldn’t find it.'], 'She was sorry she hadn’t gone.', 'medium'),
        mc('Despite the rain, the match continued.', ['started because it rained','continued even though it was raining','ended due to rain','was canceled'], 'continued even though it was raining', 'medium'),
        mc('It was only at night that he heard the news.', ['He heard the news once it got dark.','He had heard it all day.','He heard before night.','He heard immediately at night.'], 'He heard the news once it got dark.', 'medium')
      ];
      const reading2 = [
        mc('Artisan shops passage: suggests?', ['all prefer online','shops increasing','some miss local shops','local products cheaper online'], 'some miss local shops', 'medium'),
        mc('Artisan shops passage: sentiment?', ['Indifference','Nostalgia','Hostility','Indignation'], 'Nostalgia', 'medium'),
        mc('Artisan shops passage: benefit?', ['Higher prices','Unique products and personal service','Global distribution','Daily discounts'], 'Unique products and personal service', 'medium')
      ];
      const reading3 = [
        mc('Free will passage: debate about?', ['existence amid influences','eliminate genetics','no impact of genetics','which philosophers correct'], 'existence amid influences', 'hard'),
        mc('Free will passage: viewpoint?', ['proven','genetics solely control','existence contested','environment irrelevant'], 'existence contested', 'hard')
      ];
      const moreGrammar = [
        mc('The company, _________ headquarters are in Berlin, is expanding globally.', ['which','whose','that','where'], 'whose', 'medium'),
        mc('She bought ____ umbrella because it was raining.', ['a','an','the','—'], 'an', 'easy'),
        mc('Cleft: It was John _______ the document, not me.', ['signed','who signed','signed by','that sign'], 'who signed', 'hard')
      ];
      const moreUseVocab = [
        mc('Idioms: hit the nail on the head', ['dangerous','exact cause','mistake','build'], 'exact cause', 'medium'),
        mc('Word form: very ______ sense of humor.', ['quick','quicken','quickness','quickly'], 'quick', 'easy'),
        mc('C2: We __________ a solution if we had more time.', ['will have found','would have found','find','had found'], 'would have found', 'hard'),
        mc('Prepositions: He apologized ____ being late.', ['with','from','for','of'], 'for', 'easy'),
        mc('Conditionals: She treats her friends well, and _______ they often invite her out.', ['as a result','otherwise','however','consequently'], 'as a result', 'medium')
      ];
      const finalSet = [
        mc('Hardly ever cooks Italian food — same meaning?', ['every day','rarely cooks','refused','loves it'], 'rarely cooks', 'easy'),
        mc('No sooner had I sat down than the phone rang — meaning?', ['after phone','then phone rang immediately','before I sat','I sat down late'], 'then phone rang immediately', 'medium'),
        mc('Match: obsolete', ['outdated','necessary','common','newly found'], 'outdated', 'easy'),
        mc('She didn’t object to ________ new friends at the club.', ['make','making','making to','to make'], 'making', 'easy'),
        mc('I’m excited ______ the upcoming holiday.', ['with','about','at','on'], 'about', 'easy'),
        mc('Remote education passage: implies?', ['improves discipline','works equally','engagement challenge','only young'], 'engagement challenge', 'medium'),
        mc('Engagement varies widely — meaning?', ['equally engaged','inconsistent','not mentioned','everyone dislikes'], 'inconsistent', 'medium'),
        mc('Cancel trip — restatement?', ['went ahead','canceled because weather was bad','weather fine but canceled','postponed'], 'canceled because weather was bad', 'easy'),
        mc('No matter how hard he studied — equivalent?', ['with ease','so hard that he solved','failed to solve','didn’t study but solved'], 'failed to solve', 'medium'),
        mc('If she _______ earlier, she wouldn’t have missed the train.', ['left','had left','leaves','will leave'], 'had left', 'medium'),
        mc('The film, _______ garnered international awards, is a documentary.', ['which','whose','that','where'], 'which', 'medium'),
        mc('Prefix/Suffix: dis_______ meaning not fair.', ['honest','comfortably','honest','appetising'], 'honest', 'easy'),
        mc('Break the ice — meaning?', ['destroy cold','make people comfortable','end a vacation','start a fight'], 'make people comfortable', 'easy'),
        mc('Parallel structure: Tom likes swimming, _____ biking, and hiking.', ['runs','ride','to bicycle','loves'], 'to bicycle', 'medium'),
        mc('Had I known about the traffic, I _______ earlier.', ['arrived','would have arrived','would arrive','had arrived'], 'would have arrived', 'medium'),
        mc('Quantum computing passage: suggests?', ['classical bits','superposition enables speed','no advantage','superposition slower'], 'superposition enables speed', 'hard'),
        mc('Quantum computing: true?', ['common in homes','superposition unrelated','fully practical','still experimental'], 'still experimental', 'hard'),
        mc('I don’t mind if you go without me — same?', ['insist stay','okay to go without me','mind terribly','should not go'], 'okay to go without me', 'easy'),
        mc('Rarely have I seen such dedication — meaning?', ['often see dedication','seldom seen such dedication','never seen dedication','rarely see like this'], 'seldom seen such dedication', 'medium'),
        mc('Pronouns: come with us or with them? “Them” =', ['speaker’s group','other group','no one','both groups'], 'other group', 'easy'),
        mc('Word choice: His latest novel ______ critical acclaim.', ['enjoys','enjoins','envies','ensures'], 'enjoys', 'medium'),
        mc('Inversion: Only by examining the evidence _______ draw conclusions.', ['one can','can one','we can','we do'], 'can one', 'hard'),
        mc('We’ve been waiting _________ two hours!', ['in','for','since','during'], 'for', 'easy'),
        mc('Suffix: completely ________ (resolve).', ['resolved','resolutive','irresolute','irresolute'], 'resolved', 'easy'),
        mc('Conference postponed: why?', ['refused','venue and health issues','permanent cancel','insufficient funding'], 'venue and health issues', 'easy'),
        mc('Conference: what will attendees receive?', ['refund + new date','free tickets','no info','only venue'], 'refund + new date', 'easy'),
        mc('I can hardly hear you — means:', ['hear clearly','cannot hear well','listened carefully','difficulty listening'], 'cannot hear well', 'easy'),
        mc('She seldom finds time to relax — equivalent:', ['often finds time','rarely has time','never relaxes','frequently relaxes'], 'rarely has time', 'medium'),
        mc('Remember _______ the lights before you leave.', ['turn off','to turn off','turning off','off to turn'], 'to turn off', 'easy')
      ];

      const sections = [
        { name: 'Grammar', description: 'B1–C2 mixed grammar', skill: 'grammar' as const, timeLimit: 15, questions: grammar },
        { name: 'Vocabulary', description: 'Lexis & collocations', skill: 'vocabulary' as const, timeLimit: 10, questions: vocab },
        { name: 'Reading I', description: 'Short general passage', skill: 'reading' as const, timeLimit: 10, questions: reading1 },
        { name: 'Use of English', description: 'Prepositions, cloze, transformations', skill: 'grammar' as const, timeLimit: 10, questions: use },
        { name: 'Paraphrasing', description: 'Meaning equivalence', skill: 'reading' as const, timeLimit: 10, questions: paraphrase },
        { name: 'Reading II', description: 'Short passages (B2)', skill: 'reading' as const, timeLimit: 10, questions: reading2 },
        { name: 'Reading III', description: 'Abstract topics (C1)', skill: 'reading' as const, timeLimit: 10, questions: reading3 },
        { name: 'Advanced Mixed', description: 'Advanced grammar & context', skill: 'grammar' as const, timeLimit: 15, questions: moreGrammar },
        { name: 'Use & Vocab II', description: 'Idioms and usage', skill: 'vocabulary' as const, timeLimit: 10, questions: moreUseVocab },
        { name: 'Final Mixed Set', description: 'Mixed B1–C2 wrap-up', skill: 'reading' as const, timeLimit: 15, questions: finalSet }
      ];

      const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);
      const totalTime = sections.reduce((s, sec) => s + sec.timeLimit, 0);
      const test = await CEFRTest.create({
        title: 'Advanced Placement (B1–C2) – 60Q',
        description: 'Yetişkinler için B1–C2 yerleştirme: ileri dilbilgisi, kelime, okuma, Use of English ve paraphrase. Zamansız ve çoktan seçmeli.',
        cefrLevel: 'B1',
        testType: 'placement',
        timed: false,
        scoringRubric: [
          { min: 0, max: 29, level: 'B1' },
          { min: 30, max: 44, level: 'B2' },
          { min: 45, max: 55, level: 'C1' },
          { min: 56, max: 60, level: 'C2' },
        ],
        sections,
        totalQuestions,
        totalTime,
        passingScore: 60,
        isActive: true,
        isPremium: false,
        createdBy: req.user.id
      });
      return res.status(201).json({ created: true, test });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error seeding advanced placement test', error: error.message });
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