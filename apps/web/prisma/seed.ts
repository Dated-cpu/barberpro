import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Admin1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@barberpro.ru' },
    update: {},
    create: {
      email: 'admin@barberpro.ru',
      phone: '+79991111111',
      passwordHash,
      firstName: 'Admin',
      lastName: 'BarberPro',
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  const barber = await prisma.user.upsert({
    where: { email: 'alex@barberpro.ru' },
    update: {},
    create: {
      email: 'alex@barberpro.ru',
      phone: '+79992222222',
      passwordHash,
      firstName: 'Алексей',
      lastName: 'Соколов',
      role: 'BARBER',
      emailVerified: true,
    },
  });
  console.log(`  ✅ Barber: ${barber.email}`);

  const branch = await prisma.branch.upsert({
    where: { slug: 'main' },
    update: {},
    create: {
      name: 'BarberPro Main',
      slug: 'main',
      address: 'ул. Тверская, 15, Москва',
      phone: '+79991111111',
      email: 'info@barberpro.ru',
      timezone: 'Europe/Moscow',
    },
  });
  console.log(`  ✅ Branch: ${branch.name}`);

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: barber.id, branchId: branch.id } },
    update: {},
    create: { userId: barber.id, branchId: branch.id, role: 'BARBER', isPrimary: true },
  });

  const services = [
    { name: 'Мужская стрижка', description: 'Классическая или модельная стрижка', price: 1500, duration: 40, category: 'haircut', sortOrder: 1 },
    { name: 'Моделирование бороды', description: 'Коррекция и укладка бороды', price: 800, duration: 20, category: 'beard', sortOrder: 2 },
    { name: 'Стрижка + борода', description: 'Комплекс: стрижка + моделирование бороды', price: 2000, duration: 60, category: 'haircut', sortOrder: 3 },
    { name: 'Укладка', description: 'Укладка волос с профессиональными средствами', price: 600, duration: 15, category: 'styling', sortOrder: 4 },
    { name: 'Бритьё опасной бритвой', description: 'Классическое бритьё с горячим полотенцем', price: 1200, duration: 30, category: 'shave', sortOrder: 5 },
    { name: 'Королевское бритьё', description: 'Премиальное бритьё с компрессом и лосьоном', price: 2000, duration: 45, category: 'shave', sortOrder: 6 },
  ];

  const existingServices = await prisma.service.count();
  if (existingServices === 0) {
    for (const svc of services) {
      await prisma.service.create({ data: { ...svc, branchId: branch.id } });
    }
  }
  console.log(`  ✅ ${services.length} services created`);

  const systemSettings = [
    { key: 'site_name', value: '"BarberPro"', type: 'string', description: 'Название сайта' },
    { key: 'site_description', value: '"Премиальный барбершоп"', type: 'string', description: 'Описание сайта' },
    { key: 'default_timezone', value: '"Europe/Moscow"', type: 'string', description: 'Часовой пояс по умолчанию' },
    { key: 'buffer_time', value: '10', type: 'number', description: 'Буфер между записями (мин)' },
    { key: 'max_future_days', value: '30', type: 'number', description: 'Максимальный срок записи вперёд (дни)' },
  ];

  for (const setting of systemSettings) {
    await prisma.setting.upsert({
      where: { scopeId_key: { scopeId: 'system', key: setting.key } },
      update: {},
      create: { ...setting, scopeId: 'system' },
    });
  }
  console.log(`  ✅ ${systemSettings.length} system settings created`);

  console.log('\n✨ Seeding complete!');
  console.log('   Admin login: admin@barberpro.ru / Admin1234');
  console.log('   Barber login: alex@barberpro.ru / Admin1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
