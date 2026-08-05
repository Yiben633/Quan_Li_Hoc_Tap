import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'calendar-goal-check@example.com';

try {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Calendar Goal Check',
      email,
      passwordHash: 'not-a-plain-password-hash-placeholder',
      semesters: {
        create: {
          name: 'Hoc ky calendar',
          academicYear: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-12-31'),
          subjects: {
            create: {
              code: 'ENG101',
              name: 'Tieng Anh hoc thuat',
              credits: 2,
              colorHex: '#7c3aed',
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

  const [schedule, event, goal] = await Promise.all([
    prisma.schedule.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        type: 'class',
        title: 'Lop hoc thu 2',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2026-08-10'),
        recurrenceRule: 'weekly',
        reminderBefore: 30,
      },
    }),
    prisma.event.create({
      data: {
        userId: user.id,
        title: 'Nop de cuong',
        startAt: new Date('2026-08-15T09:00:00.000Z'),
        endAt: new Date('2026-08-15T10:00:00.000Z'),
        reminderBefore: 60,
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        name: 'Dat diem 8.5',
        type: 'score',
        targetValue: 8.5,
        currentValue: 0,
        deadline: new Date('2026-12-20'),
      },
    }),
  ]);

  const invalidDayOfWeek = await prisma.schedule
    .create({
      data: {
        userId: user.id,
        type: 'personal',
        title: 'Invalid day',
        dayOfWeek: 8,
        startTime: '08:00',
        endTime: '09:00',
        startDate: new Date('2026-08-10'),
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  const goalKeys = Object.keys(goal).sort();

  console.log(
    JSON.stringify(
      {
        ok: true,
        schedule: {
          id: schedule.id,
          type: schedule.type,
          recurrenceRule: schedule.recurrenceRule,
        },
        event: {
          id: event.id,
          isAllDay: event.isAllDay,
        },
        goal: {
          id: goal.id,
          type: goal.type,
          status: goal.status,
          hasProgressPercent: goalKeys.includes('progressPercent'),
        },
        invalidDayOfWeek,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}

