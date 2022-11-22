import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'JennaJames@gmail.com' },
    update: {},
    create: {
      email: 'JennaJames@gmail.com',
      firstName: 'Jenna',
      lastName: 'James',
      age: 25,
      phoneNumber: '6666666666',
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'BarbraDonal@gmail.com' },
    update: {},
    create: {
      email: 'BarbraDonald@gmail.com',
      firstName: 'Barbra',
      lastName: 'Donald',
      age: 25,
      phoneNumber: '5555555555',
    },
  });
  console.log({ user1, user2 });
}

main()
  .then(() => {
    prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
