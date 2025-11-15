module.exports = {
  async up(db) {
    // Create indexes for User collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isApproved: 1, role: 1 });
    await db.collection('users').createIndex({ approvalStatus: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ organizationId: 1 });

    // Create indexes for Lesson collection
    await db.collection('lessons').createIndex({ teacherId: 1, startTime: -1 });
    await db.collection('lessons').createIndex({ studentId: 1, startTime: -1 });
    await db.collection('lessons').createIndex({ status: 1 });
    await db.collection('lessons').createIndex({ startTime: -1 });
    await db.collection('lessons').createIndex({ teacherId: 1, status: 1 });

    // Create indexes for Reservation collection
    await db.collection('reservations').createIndex({ userId: 1, date: -1 });
    await db.collection('reservations').createIndex({ teacherId: 1, date: -1 });
    await db.collection('reservations').createIndex({ status: 1 });
    await db.collection('reservations').createIndex({ lessonId: 1 });

    // Create indexes for Availability collection
    await db.collection('availabilities').createIndex({ teacherId: 1, dayOfWeek: 1 });
    await db.collection('availabilities').createIndex({ teacherId: 1 });

    // Create indexes for Payment collection
    await db.collection('payments').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('payments').createIndex({ status: 1 });
    await db.collection('payments').createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true });
    await db.collection('payments').createIndex({ createdAt: -1 });

    // Create indexes for Message collection
    await db.collection('messages').createIndex({ senderId: 1, receiverId: 1, timestamp: -1 });
    await db.collection('messages').createIndex({ roomId: 1, timestamp: -1 });
    await db.collection('messages').createIndex({ timestamp: -1 });

    // Create indexes for Notification collection
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });

    // Create indexes for VerbfyTalkRoom collection
    await db.collection('verbfytalkrooms').createIndex({ createdBy: 1 });
    await db.collection('verbfytalkrooms').createIndex({ isActive: 1 });
    await db.collection('verbfytalkrooms').createIndex({ startedAt: -1 });

    // Create indexes for Material collection
    await db.collection('materials').createIndex({ category: 1 });
    await db.collection('materials').createIndex({ tags: 1 });
    await db.collection('materials').createIndex({ createdAt: -1 });

    // Create indexes for LessonChat collection
    await db.collection('lessonchats').createIndex({ lessonId: 1 });
    await db.collection('lessonchats').createIndex({ 'messages.timestamp': -1 });

    // Create indexes for AILearningSession collection
    await db.collection('ailearningsessions').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('ailearningsessions').createIndex({ userId: 1, topic: 1 });

    // Create indexes for PersonalizedCurriculum collection
    await db.collection('personalizedcurriculums').createIndex({ userId: 1 }, { unique: true });

    // Create indexes for TeacherAnalytics collection
    await db.collection('teacheranalytics').createIndex({ teacherId: 1 }, { unique: true });
    await db.collection('teacheranalytics').createIndex({ teacherId: 1, updatedAt: -1 });

    // Create indexes for AuditLog collection
    await db.collection('auditlogs').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('auditlogs').createIndex({ action: 1, timestamp: -1 });
    await db.collection('auditlogs').createIndex({ timestamp: -1 });

    // Create indexes for CEFRTest collection
    await db.collection('cefrtests').createIndex({ testName: 1 });

    // Create indexes for IdempotencyKey collection
    await db.collection('idempotencykeys').createIndex({ key: 1 }, { unique: true });
    await db.collection('idempotencykeys').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

    // Create indexes for Organization collection
    await db.collection('organizations').createIndex({ admin: 1 });

    // Create indexes for Role collection
    await db.collection('roles').createIndex({ name: 1 }, { unique: true });

    console.log('Initial schema indexes created successfully');
  },

  async down(db) {
    // Drop all indexes (except _id which is default)
    const collections = [
      'users', 'lessons', 'reservations', 'availabilities', 'payments',
      'messages', 'notifications', 'verbfytalkrooms', 'materials',
      'lessonchats', 'ailearningsessions', 'personalizedcurriculums',
      'teacheranalytics', 'auditlogs', 'cefrtests', 'idempotencykeys',
      'organizations', 'roles'
    ];

    for (const collection of collections) {
      try {
        await db.collection(collection).dropIndexes();
      } catch (err) {
        console.log(`Collection ${collection} doesn't exist or indexes already dropped`);
      }
    }

    console.log('All indexes dropped successfully');
  }
};
