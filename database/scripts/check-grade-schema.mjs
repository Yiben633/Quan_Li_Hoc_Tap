import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'grade-check@example.com';

try {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Grade Check',
      email,
      passwordHash: 'not-a-plain-password-hash-placeholder',
      semesters: {
        create: {
          name: 'Hoc ky diem so',
          academicYear: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-12-31'),
          subjects: {
            create: {
              code: 'PHY101',
              name: 'Vat ly dai cuong',
              credits: 3,
              colorHex: '#f59e0b',
              targetGrade: 8.5,
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

  const attendance = await prisma.gradeComponent.create({
    data: {
      subjectId: subject.id,
      name: 'Chuyen can',
      weightPercent: 10,
      sortOrder: 1,
      grade: {
        create: {
          score: 9,
          gradedAt: new Date('2026-09-01T00:00:00.000Z'),
        },
      },
    },
  });

  await prisma.gradeComponent.create({
    data: {
      subjectId: subject.id,
      name: 'Giua ky',
      weightPercent: 30,
      sortOrder: 2,
      grade: {
        create: {
          score: 8,
          gradedAt: new Date('2026-10-15T00:00:00.000Z'),
        },
      },
    },
  });

  await prisma.gradeComponent.create({
    data: {
      subjectId: subject.id,
      name: 'Cuoi ky',
      weightPercent: 60,
      sortOrder: 3,
    },
  });

  const [summary] = await prisma.$queryRaw`
    SELECT
      subject_id,
      component_count,
      scored_component_count,
      scored_weight_percent,
      current_average
    FROM subject_grade_summaries
    WHERE subject_id = ${subject.id}::uuid
  `;

  const invalidWeight = await prisma.gradeComponent
    .create({
      data: {
        subjectId: subject.id,
        name: 'Invalid weight',
        weightPercent: 120,
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  await prisma.subject.delete({ where: { id: subject.id } });

  const [componentCount, gradeCount] = await Promise.all([
    prisma.gradeComponent.count({ where: { subjectId: subject.id } }),
    prisma.grade.count({ where: { gradeComponentId: attendance.id } }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary: {
          subjectId: summary.subject_id,
          componentCount: Number(summary.component_count),
          scoredComponentCount: Number(summary.scored_component_count),
          scoredWeightPercent: Number(summary.scored_weight_percent),
          currentAverage: Number(summary.current_average),
        },
        invalidWeight,
        cascadeAfterSubjectDelete: {
          gradeComponents: componentCount,
          gradesForFirstComponent: gradeCount,
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

