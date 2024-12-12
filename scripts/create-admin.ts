import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@epassport.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin User';
  const checkOnly = process.argv.includes('--check-only');

  // При --check-only только проверяем существование админа
  if (checkOnly) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    if (existingAdmin) {
      console.log('Admin user exists');
      process.exit(0);
    } else {
      console.log('Admin user not found');
      process.exit(1);
    }
    return;
  }

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
      role: 'ADMIN'
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN'
    }
  });

  console.log('Admin user created/updated:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  