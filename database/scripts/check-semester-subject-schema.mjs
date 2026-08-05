import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'schema-check@example.com';
const subjectCode = 'MATH101';

try {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Schema Check',
      email,
      passwordHash: 'not-a-plain-password-hash-placeholder',
      semesters: {
        create: {
          name: 'Hoc ky kiem tra',
          academicYear: '2026-2027',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-12-31'),
          status: 'planning',
          subjects: {
            create: {
              code: subjectCode,
              name: 'Toan roi rac',
              credits: 3,
              colorHex: '#2563eb',
              status: 'in_progress',
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

  const semester = user.semesters[0];
  const subject = semester.subjects[0];

  const duplicateResult = await prisma.subject
    .create({
      data: {
        userId: user.id,
        semesterId: semester.id,
        code: subjectCode,
        name: 'Duplicate should fail',
        credits: 2,
        colorHex: '#dc2626',
      },
    })
    .then(() => 'unexpected-success')
    .catch((error) => error.code ?? error.constructor.name);

  await prisma.subject.update({
    where: { id: subject.id },
    data: { deletedAt: new Date() },
  });

  const recreatedSubject = await prisma.subject.create({
    data: {
      userId: user.id,
      semesterId: semester.id,
      code: subjectCode,
      name: 'Toan roi rac restored code',
      credits: 3,
      colorHex: '#16a34a',
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        semester: {
          id: semester.id,
          status: semester.status,
        },
        subject: {
          id: recreatedSubject.id,
          code: recreatedSubject.code,
          status: recreatedSubject.status,
        },
        duplicateCheck: duplicateResult,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
}

