import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBootstrapEmail() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error('ADMIN_BOOTSTRAP_EMAIL is required');
  if (!emailPattern.test(email)) throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address');
  return email;
}

function maskEmail(email) {
  const [localPart, domain] = email.split('@');
  return `${localPart.slice(0, 2)}***@${domain}`;
}

async function grantBootstrapAdmin(email) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true },
    });

    if (!user) return null;

    const role = await tx.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'System administrator role',
      },
    });

    const currentAssignment = await tx.userRole.findUnique({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      select: { userId: true },
    });

    if (currentAssignment) {
      return { user, granted: false };
    }

    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.bootstrap_granted',
        entityType: 'user',
        entityId: user.id,
        metadata: { role: 'admin', source: 'bootstrap_script' },
      },
    });

    return { user, granted: true };
  });
}

async function main() {
  const email = readBootstrapEmail();
  const result = await grantBootstrapAdmin(email);

  if (!result) {
    throw new Error(`No existing account matches ${maskEmail(email)}. Register that account before granting admin access.`);
  }

  const status = result.granted ? 'granted' : 'already assigned';
  console.log(`Admin role ${status} for user ${result.user.id} (${maskEmail(result.user.email)}).`);
  console.log('Sign out and sign in again to receive an access token with the admin role.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Unable to grant bootstrap admin role');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
