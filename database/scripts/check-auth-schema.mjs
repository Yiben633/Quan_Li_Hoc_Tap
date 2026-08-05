import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const [userCount, roleCount, refreshTokenCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.refreshToken.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        tables: {
          users: userCount,
          roles: roleCount,
          refreshTokens: refreshTokenCount,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}

