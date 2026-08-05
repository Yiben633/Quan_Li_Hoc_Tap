import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleUsers = ['admin@studyflow.local', 'student@studyflow.local'];

const subjects = [
  {
    code: 'CS101',
    name: 'Nhap mon lap trinh',
    credits: 3,
    lecturer: 'ThS. Nguyen Minh',
    room: 'A101',
    colorHex: '#2563eb',
    targetGrade: 8.5,
  },
  {
    code: 'MATH201',
    name: 'Toan roi rac',
    credits: 3,
    lecturer: 'TS. Tran Ha',
    room: 'B204',
    colorHex: '#16a34a',
    targetGrade: 8,
  },
  {
    code: 'ENG102',
    name: 'Tieng Anh hoc thuat',
    credits: 2,
    lecturer: 'Ms. Anna Le',
    room: 'C302',
    colorHex: '#9333ea',
    targetGrade: 8,
  },
  {
    code: 'DB301',
    name: 'Co so du lieu',
    credits: 3,
    lecturer: 'ThS. Pham Khoa',
    room: 'LAB-2',
    colorHex: '#ea580c',
    targetGrade: 8.7,
  },
];

const taskStatuses = ['todo', 'in_progress', 'waiting', 'done'] as const;
const priorities = ['medium', 'high', 'urgent', 'low'] as const;

async function main() {
  console.log('Seeding StudyFlow database...');

  await prisma.activityLog.deleteMany({
    where: {
      action: {
        startsWith: 'seed.',
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: sampleUsers,
      },
    },
  });

  const [studentRole, adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'student' },
      update: { description: 'Default student role' },
      create: { name: 'student', description: 'Default student role' },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: { description: 'System administrator role' },
      create: { name: 'admin', description: 'System administrator role' },
    }),
  ]);

  const [adminPasswordHash, studentPasswordHash] = await Promise.all([
    bcrypt.hash('Admin@123456', 12),
    bcrypt.hash('Student@123456', 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      fullName: 'StudyFlow Admin',
      email: 'admin@studyflow.local',
      passwordHash: adminPasswordHash,
      school: 'StudyFlow University',
      major: 'System Administration',
      courseYear: 2026,
      isEmailVerified: true,
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
      notificationSetting: {
        create: {
          reminderMinutesBefore: 60,
          emailEnabled: true,
        },
      },
    },
  });

  const student = await prisma.user.create({
    data: {
      fullName: 'Nguyen Van Sinh Vien',
      email: 'student@studyflow.local',
      studentCode: 'SV2026001',
      passwordHash: studentPasswordHash,
      school: 'StudyFlow University',
      major: 'Cong nghe thong tin',
      courseYear: 2026,
      isEmailVerified: true,
      roles: {
        create: {
          roleId: studentRole.id,
        },
      },
      notificationSetting: {
        create: {
          reminderMinutesBefore: 30,
          inAppEnabled: true,
          emailEnabled: false,
        },
      },
    },
  });

  const semester = await prisma.semester.create({
    data: {
      userId: student.id,
      name: 'Hoc ky 1',
      academicYear: '2026-2027',
      startDate: new Date('2026-08-12'),
      endDate: new Date('2026-12-28'),
      status: 'active',
      targetGpa: 3.4,
      expectedCredits: 11,
      note: 'Hoc ky mau cho moi truong dev.',
    },
  });

  for (const [subjectIndex, subjectInput] of subjects.entries()) {
    const subject = await prisma.subject.create({
      data: {
        ...subjectInput,
        semesterId: semester.id,
        userId: student.id,
        status: 'in_progress',
        note: `Mon hoc mau ${subjectInput.code}`,
      },
    });

    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: student.id,
        subjectId: subject.id,
        title: `Ke hoach hoc ${subject.code}`,
        description: `Lap ke hoach theo tuan cho mon ${subject.name}.`,
        startDate: new Date('2026-08-12'),
        endDate: new Date('2026-12-20'),
        targetGoal: `Dat diem muc tieu ${subject.targetGrade}`,
        estimatedHours: 36 + subjectIndex * 4,
        priority: subjectIndex === 3 ? 'urgent' : 'high',
        status: 'in_progress',
        progressPercent: 25,
      },
    });

    for (const [taskIndex, status] of taskStatuses.entries()) {
      await prisma.task.create({
        data: {
          userId: student.id,
          subjectId: subject.id,
          studyPlanId: studyPlan.id,
          title: `${subject.code} - Nhiem vu ${taskIndex + 1}`,
          description: `Task mau trang thai ${status}.`,
          startDate: new Date(`2026-08-${12 + taskIndex}`),
          dueDate: new Date(`2026-08-${18 + subjectIndex * 2 + taskIndex}T17:00:00.000Z`),
          estimatedMinutes: 45 + taskIndex * 15,
          difficulty: Math.min(taskIndex + 2, 5),
          priority: priorities[taskIndex],
          status,
          sortOrder: taskIndex,
          completedAt: status === 'done' ? new Date('2026-08-19T10:00:00.000Z') : null,
          subTasks: {
            create: [
              { title: 'Doc yeu cau', sortOrder: 1, isDone: status === 'done' },
              { title: 'Hoan thanh bai lam', sortOrder: 2, isDone: status === 'done' },
            ],
          },
        },
      });
    }

    const firstTask = await prisma.task.findFirstOrThrow({
      where: {
        userId: student.id,
        subjectId: subject.id,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    await prisma.gradeComponent.create({
      data: {
        subjectId: subject.id,
        name: 'Giua ky',
        maxScore: 10,
        weightPercent: 40,
        examDate: new Date('2026-10-15'),
        sortOrder: 1,
        grade: {
          create: {
            score: 7.5 + subjectIndex * 0.2,
            gradedAt: new Date('2026-10-20T00:00:00.000Z'),
          },
        },
      },
    });

    await prisma.gradeComponent.create({
      data: {
        subjectId: subject.id,
        name: 'Cuoi ky',
        maxScore: 10,
        weightPercent: 60,
        examDate: new Date('2026-12-15'),
        sortOrder: 2,
      },
    });

    await prisma.document.create({
      data: {
        userId: student.id,
        subjectId: subject.id,
        taskId: firstTask.id,
        title: `${subject.code} - De cuong mon hoc`,
        fileUrl: `https://example.com/documents/${subject.code.toLowerCase()}-de-cuong.pdf`,
        fileType: 'pdf',
        storageProvider: 'local',
        sizeBytes: 1024 * (subjectIndex + 1),
        tags: ['de-cuong', subject.code.toLowerCase()],
      },
    });

    await prisma.note.create({
      data: {
        userId: student.id,
        subjectId: subject.id,
        taskId: firstTask.id,
        title: `${subject.code} - Ghi chu buoi dau`,
        contentRichText: `<p>Ghi chu mau cho mon ${subject.name}.</p>`,
        isPinned: subjectIndex === 0,
        tags: ['ghi-chu', subject.code.toLowerCase()],
      },
    });

    await prisma.schedule.create({
      data: {
        userId: student.id,
        subjectId: subject.id,
        type: 'class',
        title: `Lop ${subject.code}`,
        dayOfWeek: (subjectIndex + 1) % 6,
        startTime: `${8 + subjectIndex}:00`,
        endTime: `${10 + subjectIndex}:00`,
        startDate: new Date('2026-08-12'),
        endDate: new Date('2026-12-20'),
        recurrenceRule: 'weekly',
        colorHex: subject.colorHex,
        reminderBefore: 30,
      },
    });
  }

  const firstSubject = await prisma.subject.findFirstOrThrow({
    where: {
      userId: student.id,
      code: subjects[0].code,
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: student.id,
        subjectId: firstSubject.id,
        name: 'Dat diem mon lap trinh',
        type: 'score',
        targetValue: 8.5,
        currentValue: 7.5,
        deadline: new Date('2026-12-20'),
        status: 'in_progress',
      },
      {
        userId: student.id,
        name: 'Hoc 40 gio trong thang',
        type: 'study_time',
        targetValue: 2400,
        currentValue: 360,
        deadline: new Date('2026-09-30'),
        status: 'in_progress',
      },
      {
        userId: student.id,
        name: 'Hoan thanh 12 nhiem vu',
        type: 'task_count',
        targetValue: 12,
        currentValue: 4,
        deadline: new Date('2026-10-31'),
        status: 'in_progress',
      },
    ],
  });

  await prisma.event.createMany({
    data: [
      {
        userId: student.id,
        title: 'Hop nhom do an',
        description: 'Su kien mau cho calendar.',
        startAt: new Date('2026-08-22T13:00:00.000Z'),
        endAt: new Date('2026-08-22T14:30:00.000Z'),
        colorHex: '#0f766e',
        reminderBefore: 60,
      },
      {
        userId: student.id,
        title: 'Nop bao cao tuan',
        description: 'Deadline ca nhan.',
        startAt: new Date('2026-08-25T09:00:00.000Z'),
        endAt: new Date('2026-08-25T09:30:00.000Z'),
        colorHex: '#dc2626',
        reminderBefore: 1440,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: 'deadline_soon',
        title: 'Nhiem vu sap den han',
        message: 'Ban co nhiem vu can hoan thanh trong tuan nay.',
        relatedEntityType: 'task',
        channel: 'in_app',
      },
      {
        userId: student.id,
        type: 'system',
        title: 'Chao mung den StudyFlow',
        message: 'Du lieu mau da san sang de ban thu nghiem dashboard.',
        channel: 'in_app',
      },
    ],
  });

  await prisma.studySession.create({
    data: {
      userId: student.id,
      subjectId: firstSubject.id,
      startedAt: new Date('2026-08-20T01:00:00.000Z'),
      endedAt: new Date('2026-08-20T02:00:00.000Z'),
      totalMinutes: 60,
      note: 'Phien hoc mau dau tien.',
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
  });

  await prisma.flashcardSet.create({
    data: {
      userId: student.id,
      subjectId: firstSubject.id,
      name: 'Flashcard mau',
      description: 'Bo the mau cho tinh nang on tap.',
      flashcards: {
        create: [
          {
            question: 'StudyFlow dung de lam gi?',
            answer: 'Quan ly ke hoach hoc tap, task, lich va tien do.',
          },
          {
            question: 'Pomodoro focus mac dinh bao lau?',
            answer: 'Thuong la 25 phut.',
            isDifficult: true,
            nextReviewAt: new Date('2026-08-25T00:00:00.000Z'),
          },
        ],
      },
    },
  });

  await prisma.studyGroup.create({
    data: {
      ownerId: student.id,
      name: 'Nhom on tap mau',
      description: 'Nhom hoc tap mau cho moi truong dev.',
      members: {
        create: {
          userId: student.id,
          role: 'leader',
          status: 'accepted',
          joinedAt: new Date('2026-08-12T00:00:00.000Z'),
        },
      },
      tasks: {
        create: {
          assignedUserId: student.id,
          title: 'Chuan bi slide on tap',
          description: 'Group task mau.',
          dueDate: new Date('2026-09-01T17:00:00.000Z'),
          status: 'todo',
        },
      },
    },
  });

  await prisma.feedback.create({
    data: {
      userId: student.id,
      type: 'feature_request',
      title: 'Them widget lich thong minh',
      content: 'Feedback mau cho admin dashboard.',
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'seed.admin_created',
        entityType: 'user',
        entityId: admin.id,
        metadata: {
          email: admin.email,
        },
      },
      {
        userId: student.id,
        action: 'seed.student_created',
        entityType: 'user',
        entityId: student.id,
        metadata: {
          email: student.email,
          subjects: subjects.length,
        },
      },
    ],
  });

  console.log('Seed completed.');
  console.log('Admin: admin@studyflow.local / Admin@123456');
  console.log('Student: student@studyflow.local / Student@123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

