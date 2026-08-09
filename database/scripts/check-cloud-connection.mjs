import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

function describeUrl(name, value) {
  if (!value) throw new Error(`${name} is required`);
  const parsed = new URL(value);
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(`${name} must use the PostgreSQL protocol`);
  }
  return {
    name,
    value,
    host: parsed.hostname,
    mode: parsed.hostname.includes('-pooler.') ? 'pooled' : 'direct',
  };
}

const connections = [
  describeUrl('DATABASE_URL', process.env.DATABASE_URL),
  describeUrl('DIRECT_URL', process.env.DIRECT_URL),
];

for (const connection of connections) {
  const prisma = new PrismaClient({ datasourceUrl: connection.value });
  try {
    const [identity] =
      await prisma.$queryRaw`SELECT current_database() AS database_name, current_user AS role_name`;
    console.log(`${connection.name}: connected (${connection.mode})`);
    console.log(
      `  host=${connection.host} database=${identity.database_name} role=${identity.role_name}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
