import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'jennajames@gmail.com' },
    update: {},
    create: {
      email: 'jennajames@gmail.com',
      firstName: 'Jenna',
      lastName: 'James',
      password: bcrypt.hashSync('password', 10),
      age: 25,
      phoneNumber: '1234567890',
      gym: {
        create: {
          name: 'Dallas TX Gym',
          location: {
            create: {
              lat: 32.7766642,
              long: -96.79698789999999,
            },
          },
        },
      },
    },
  });
  const gyms = await prisma.gym.findMany({});
  const user2 = await prisma.user.upsert({
    where: { email: 'barbrajanson@gmail.com' },
    update: {},
    create: {
      email: 'barbrajanson@gmail.com',
      firstName: 'Barbra',
      lastName: 'Janson',
      password: bcrypt.hashSync('password', 10),
      age: 25,
      phoneNumber: '1234567891',
      gym: {
        connectOrCreate: {
          where: {
            id: gyms[0]?.id,
          },
          create: {
            name: 'Dallas TX Gym',
            location: {
              create: {
                lat: 32.7766642,
                long: -96.79698789999999,
              },
            },
          },
        },
      },
    },
  });
  const user3 = await prisma.user.upsert({
    where: { email: 'johnny garyson' },
    update: {},
    create: {
      email: 'johnnygaryson@gmail.com',
      password: bcrypt.hashSync('password', 10),
      firstName: 'Johnny',
      lastName: 'Garyson',
      age: 25,
      phoneNumber: '1234567892',
      gym: {
        create: {
          name: 'LA Fitness',
          location: {
            create: {
              lat: 34.187771,
              long: -118.588928,
            },
          },
        },
      },
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
