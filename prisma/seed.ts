import { Prisma, PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Sex, faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const generateRandomPhoneNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// create a function that will create a user with a unique email
// and a random phone number

const generateEmail = (firstName: string, lastName: string) => {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}@gmail.com`;
};

function randomGender(): Sex {
  const genders = ['male', 'female'];
  return genders[Math.floor(Math.random() * genders.length)] as Sex;
}

function getRandomProfilePicture() {
  const randomId = Math.floor(Math.random() * 1000); // Generate a random number between 0 and 1000
  return `https://source.unsplash.com/random/200x200?sig=${randomId}&portrait`;
}

function generateRandomUserData(): Prisma.UserCreateInput {
  // random gender
  const gender = randomGender();
  const firstName = faker.name.firstName(gender);
  const lastName = faker.name.lastName();

  return {
    email: faker.internet.email(firstName, lastName),
    firstName,
    lastName,
    password: 'password',
    bio: faker.lorem.sentence(),
    gender,
    age: Number(faker.random.numeric(2)),
    authSteps: 7,
    phoneNumber: faker.phone.phoneNumber(),
    verified: true,
    isBot: true,
    images: [
      getRandomProfilePicture(),
      getRandomProfilePicture(),
      getRandomProfilePicture(),
    ],
    split: {
      create: {
        monday: ['chest', 'back'],
        tuesday: ['legs'],
        wednesday: ['chest', 'back'],
        thursday: ['legs'],
        friday: ['chest', 'back'],
        saturday: ['legs'],
        sunday: ['chest', 'back'],
      },
    },
    gym: {
      create: {
        name: 'Fit4Less',
        location: {
          create: {
            lat: 42.300916870848894,
            long: -82.97919754434378,
          },
        },
      },
    },
  };
}

async function createUser(prisma: any, userData: Prisma.UserCreateInput) {
  return await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: userData,
  });
}

async function main() {
  const numberOfUsers = 10; // Change this value to create more or fewer users

  for (let i = 0; i < numberOfUsers; i++) {
    const randomUserData = generateRandomUserData();
    const newUser = await createUser(prisma, randomUserData);
    console.log(`Created user: ${newUser.firstName} ${newUser.lastName}`);
  }
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
