import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'plan-task-check@example.com';

try {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Plan Task Check',
      email,
      passwordHash: 'not-a-plain-password-hash-placeholder',
      semesters: {
        create: {
          name: 'Hoc ky task',
          academicYear: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-12-31'),
          subjects: {
            create: {
              code: 'CS101',
              name: 'Nhap mon lap trinh',
              credits: 3,
              colorHex: '#0891b2',
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

  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      subjectId: subject.id,
      title: 'On tap chuong 1',
      priority: 'high',
      status: 'in_progress',
      tasks: {
        create: {
          userId: user.id,
          subjectId: subject.id,
          title: 'Doc giao trinh',
          difficulty: 3,
          priority: 'high',
          status: 'todo',
          sortOrder: 10,
          subTasks: {
            create: [
              { title: 'Doc muc 1.1', sortOrder: 1 },
              { title: 'Lam vi du', sortOrder: 2 },
            ],
          },
          attachments: {
            create: {
              fileUrl: 'https://example.com/syllabus.pdf',
              fileName: 'syllabus.pdf',
              fileType: 'pdf',
              sizeBytes: 1024,
            },
          },
        },
      },
    },
    include: {
      tasks: {
        include: {
          subTasks: true,
          attachments: true,
        },
      },
    },
  });

  const task = plan.tasks[0];

  const invalidDifficulty = await prisma.task
    .create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        title: 'Difficulty invalid',
        difficulty: 6,
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  await prisma.task.delete({ where: { id: task.id } });

  const [subTaskCount, attachmentCount] = await Promise.all([
    prisma.subTask.count({ where: { taskId: task.id } }),
    prisma.taskAttachment.count({ where: { taskId: task.id } }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        plan: {
          id: plan.id,
          status: plan.status,
          priority: plan.priority,
        },
        createdTask: {
          id: task.id,
          subTasks: task.subTasks.length,
          attachments: task.attachments.length,
        },
        invalidDifficulty,
        cascadeAfterTaskDelete: {
          subTasks: subTaskCount,
          attachments: attachmentCount,
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

