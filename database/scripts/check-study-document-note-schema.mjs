import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'study-document-note-check@example.com';

try {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Study Document Note Check',
      email,
      passwordHash: 'not-a-plain-password-hash-placeholder',
      semesters: {
        create: {
          name: 'Hoc ky tai lieu',
          academicYear: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-12-31'),
          subjects: {
            create: {
              code: 'DOC101',
              name: 'Phuong phap hoc dai hoc',
              credits: 2,
              colorHex: '#0f766e',
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

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: subject.id,
      title: 'Doc chuong 1',
    },
  });

  const studySession = await prisma.studySession.create({
    data: {
      userId: user.id,
      subjectId: subject.id,
      startedAt: new Date('2026-08-20T01:00:00.000Z'),
      endedAt: new Date('2026-08-20T02:00:00.000Z'),
      totalMinutes: 60,
      note: 'On tap chuong mo dau',
      pomodoroSessions: {
        create: {
          sessionType: 'focus',
          plannedMinutes: 25,
          actualMinutes: 25,
          startedAt: new Date('2026-08-20T01:00:00.000Z'),
          endedAt: new Date('2026-08-20T01:25:00.000Z'),
          isCompleted: true,
        },
      },
    },
    include: {
      pomodoroSessions: true,
    },
  });

  const [document, note] = await Promise.all([
    prisma.document.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        taskId: task.id,
        title: 'De cuong mon hoc',
        fileUrl: 'https://example.com/de-cuong.pdf',
        fileType: 'pdf',
        storageProvider: 'local',
        sizeBytes: 2048,
        tags: ['de-cuong', 'pdf'],
      },
    }),
    prisma.note.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        taskId: task.id,
        title: 'Ghi chu chuong 1',
        contentRichText: '<p>Noi dung ghi chu da sanitize o backend.</p>',
        isPinned: true,
        tags: ['chuong-1'],
      },
    }),
  ]);

  const invalidSize = await prisma.document
    .create({
      data: {
        userId: user.id,
        title: 'Invalid size',
        fileUrl: 'https://example.com/bad.pdf',
        fileType: 'pdf',
        storageProvider: 'local',
        sizeBytes: -1,
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  await prisma.studySession.delete({ where: { id: studySession.id } });

  const pomodoroCount = await prisma.pomodoroSession.count({
    where: { studySessionId: studySession.id },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        studySession: {
          id: studySession.id,
          pomodoroSessions: studySession.pomodoroSessions.length,
        },
        document: {
          id: document.id,
          fileType: document.fileType,
          storageProvider: document.storageProvider,
          tags: document.tags,
        },
        note: {
          id: note.id,
          isPinned: note.isPinned,
          tags: note.tags,
        },
        invalidSize,
        cascadeAfterStudySessionDelete: {
          pomodoroSessions: pomodoroCount,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}

