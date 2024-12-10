import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@epassport.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is required');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: adminName,
    },
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', { email: admin.email, name: admin.name, role: admin.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
