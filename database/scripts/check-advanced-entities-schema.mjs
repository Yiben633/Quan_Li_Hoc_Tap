import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'advanced-check@example.com';

try {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Advanced Check',
      email,
      passwordHash: 'not-a-plain-password-hash-placeholder',
      semesters: {
        create: {
          name: 'Hoc ky nang cao',
          academicYear: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-12-31'),
          subjects: {
            create: {
              code: 'ADV101',
              name: 'Ky nang hoc nhom',
              credits: 2,
              colorHex: '#db2777',
            },
          },
        },
      },
    },
    include: {
      semesters: {
        include: {
          subjects: true,
        },
      },
    },
  });

  const subject = user.semesters[0].subjects[0];

  const [notification, notificationSetting, flashcardSet, studyGroup, feedback, activityLog] =
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'deadline_soon',
          title: 'Sap den han',
          message: 'Ban co nhiem vu sap den han.',
          relatedEntityType: 'task',
          relatedEntityId: user.id,
          channel: 'in_app',
        },
      }),
      prisma.notificationSetting.create({
        data: {
          userId: user.id,
          reminderMinutesBefore: 60,
          emailEnabled: true,
        },
      }),
      prisma.flashcardSet.create({
        data: {
          userId: user.id,
          subjectId: subject.id,
          name: 'Bo the on tap',
          flashcards: {
            create: {
              question: 'Pomodoro la gi?',
              answer: 'Mot ky thuat quan ly thoi gian.',
              isDifficult: true,
              correctCount: 1,
              wrongCount: 0,
              nextReviewAt: new Date('2026-08-21T00:00:00.000Z'),
            },
          },
        },
        include: {
          flashcards: true,
        },
      }),
      prisma.studyGroup.create({
        data: {
          ownerId: user.id,
          name: 'Nhom hoc thu nghiem',
          members: {
            create: {
              userId: user.id,
              role: 'leader',
              status: 'accepted',
              joinedAt: new Date('2026-08-20T00:00:00.000Z'),
            },
          },
          tasks: {
            create: {
              assignedUserId: user.id,
              title: 'Chia noi dung thuyet trinh',
              status: 'todo',
            },
          },
        },
        include: {
          members: true,
          tasks: true,
        },
      }),
      prisma.feedback.create({
        data: {
          userId: user.id,
          type: 'bug',
          title: 'Loi demo',
          content: 'Noi dung feedback mau.',
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: null,
          action: 'system.schema_check',
          entityType: 'system',
          metadata: {
            source: 'check-advanced-entities-schema',
          },
        },
      }),
    ]);

  const duplicateNotificationSetting = await prisma.notificationSetting
    .create({
      data: {
        userId: user.id,
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  const duplicateGroupMember = await prisma.groupMember
    .create({
      data: {
        studyGroupId: studyGroup.id,
        userId: user.id,
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  const invalidFlashcardCount = await prisma.flashcard
    .create({
      data: {
        flashcardSetId: flashcardSet.id,
        question: 'Invalid',
        answer: 'Invalid',
        correctCount: -1,
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  console.log(
    JSON.stringify(
      {
        ok: true,
        notification: {
          id: notification.id,
          type: notification.type,
          isRead: notification.isRead,
          channel: notification.channel,
        },
        notificationSetting: {
          id: notificationSetting.id,
          reminderMinutesBefore: notificationSetting.reminderMinutesBefore,
          inAppEnabled: notificationSetting.inAppEnabled,
        },
        flashcardSet: {
          id: flashcardSet.id,
          flashcards: flashcardSet.flashcards.length,
        },
        studyGroup: {
          id: studyGroup.id,
          members: studyGroup.members.length,
          tasks: studyGroup.tasks.length,
        },
        feedback: {
          id: feedback.id,
          status: feedback.status,
        },
        activityLog: {
          id: activityLog.id,
          userId: activityLog.userId,
          action: activityLog.action,
        },
        duplicateNotificationSetting,
        duplicateGroupMember,
        invalidFlashcardCount,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}

