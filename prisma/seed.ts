import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const generateRandomPhoneNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// create a function that will create a user with a unique email
// and a random phone number

const generateEmail = (firstName: string, lastName: string) => {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}@gmail.com`;
};
const createUser = async (firstName: string, lastName: string) => {
  return await prisma.user.create({
    data: {
      email: generateEmail(firstName, lastName),
      firstName,
      lastName,
      password: bcrypt.hashSync('password', 10),
      age: 25,
      authSteps: 7,
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      images: [
        'https://api.lorem.space/image/face?w=500&h=500',
        'https://api.lorem.space/image/face?w=500&h=500',
        'https://api.lorem.space/image/face?w=500&h=500',
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
    },
    select: {
      isBot: true,
    },
  });
};

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'jennyjane@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1672344838703-a5fc22950698?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1748&q=80',
        'https://images.unsplash.com/photo-1672329367841-537174916cf1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'jennyjane@gmail.com',
      firstName: 'Jenny',
      lastName: 'Jane',
      password: bcrypt.hashSync('password', 10),
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      age: 25,
      authSteps: 7,
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
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
    },
  });
  const gyms = await prisma.gym.findMany({});
  const user2 = await prisma.user.upsert({
    where: { email: 'barbrajanson@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1672370751865-7f904be99287?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1672370751361-f5e825e28265?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1672335517508-4275d5d2dc7c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'barbrajanson@gmail.com',
      firstName: 'Barbra',
      lastName: 'Janson',
      password: bcrypt.hashSync('password', 10),
      age: 25,
      authSteps: 7,
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        connectOrCreate: {
          where: {
            id: gyms[0]?.id,
          },
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
      },
    },
  });
  const user3 = await prisma.user.upsert({
    where: { email: 'jerryjohn@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=840&q=80',
        'https://images.unsplash.com/photo-1524612791852-a605042808d8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'jerryjohn@gmail.com',
      firstName: 'Jerry',
      lastName: 'John',
      password: bcrypt.hashSync('password', 10),
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      age: 25,
      authSteps: 7,
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        connectOrCreate: {
          where: {
            id: gyms[0]?.id,
          },
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
      },
    },
  });
  const user4 = await prisma.user.upsert({
    where: { email: 'lorrylane@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1512101903502-7eb0c9022c74?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1524255684952-d7185b509571?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=930&q=80',
      ],
      email: 'lorrylane@gmail.com',
      firstName: 'Lorry',
      lastName: 'Lane',
      password: bcrypt.hashSync('password', 10),
      age: 25,
      authSteps: 7,
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        create: {
          name: 'Raw Training Facility',
          location: {
            create: {
              lat: 42.27800040543352,
              long: -82.97914788852275,
            },
          },
        },
      },
    },
  });
  const gyms2 = await prisma.gym.findMany({});
  const user5 = await prisma.user.upsert({
    where: { email: 'janiltrate@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601288848351-48adce9d676a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601289149034-2daad70d0076?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'janiletrate@gmail.com',
      firstName: 'Janile',
      lastName: 'Trate',
      password: bcrypt.hashSync('password', 10),
      age: 25,
      authSteps: 7,
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        connectOrCreate: {
          where: {
            id: gyms2[1]?.id,
          },
          create: {
            name: 'Raw Training Facility',
            location: {
              create: {
                lat: 42.27800040543352,
                long: -82.97914788852275,
              },
            },
          },
        },
      },
    },
  });
  const user6 = await prisma.user.upsert({
    where: { email: 'sarrysash@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601288848351-48adce9d676a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601289149034-2daad70d0076?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'sarrysash@gmail.com',
      firstName: 'Sarry',
      lastName: 'Sash',
      password: bcrypt.hashSync('password', 10),
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      age: 25,
      authSteps: 7,
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        create: {
          name: 'Powerhouse Gym Pontiac',
          location: {
            create: {
              // 42.63951525870375, -83.3261511006397
              lat: 42.63951525870375,
              long: -83.3261511006397,
            },
          },
        },
      },
    },
  });
  const gyms3 = await prisma.gym.findMany({});
  const user7 = await prisma.user.upsert({
    where: { email: 'sarrysash@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601288848351-48adce9d676a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601289149034-2daad70d0076?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'sarrysash@gmail.com',
      firstName: 'Sarry',
      lastName: 'Sash',
      password: bcrypt.hashSync('password', 10),
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      age: 25,
      authSteps: 7,
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        connectOrCreate: {
          where: {
            id: gyms3[2]?.id,
          },
          create: {
            name: 'Powerhouse Gym Pontiac',
            location: {
              create: {
                lat: 42.27800040543352,
                long: -82.97914788852275,
              },
            },
          },
        },
      },
    },
  });
  const user8 = await prisma.user.upsert({
    where: { email: 'falicityable@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601288848351-48adce9d676a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601289149034-2daad70d0076?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'falicityable@gmail.com',
      firstName: 'Falicity',
      lastName: 'Able',
      password: bcrypt.hashSync('password', 10),
      bio: 'I love to workout and I am looking for someone to workout with! Fit4Less is my favorite gym and I am looking for someone to go with me!',
      age: 25,
      authSteps: 7,
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
      gym: {
        create: {
          name: 'Power House Gym Houston',
          location: {
            create: {
              lat: 29.7758855537138,
              long: -95.2850380168684,
            },
          },
        },
      },
    },
  });
  const user9 = await prisma.user.upsert({
    where: { email: 'hemryrane@gmail.com' },
    update: {},
    create: {
      images: [
        'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601288848351-48adce9d676a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
        'https://images.unsplash.com/photo-1601289149034-2daad70d0076?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
      ],
      email: 'hemryrane@gmail.com',
      firstName: 'Hemry',
      lastName: 'Rane',
      password: bcrypt.hashSync('password', 10),
      bio: 'I love to workout and I am looking for someone to workout with! I go to the best gym in Lansing, it is my favorite gym and I am looking for someone to go with me!',
      age: 25,
      authSteps: 7,
      phoneNumber: generateRandomPhoneNumber(),
      verified: true,
      isBot: true,
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
          name: 'State of Fitness',
          location: {
            create: {
              lat: 42.73721016408339,
              long: -84.54561717359337,
            },
          },
        },
      },
    },
    select: {
      isBot: true,
    },
  });
  const user10 = await createUser('June', 'Jame');
  const user11 = await createUser('Jame', 'June');
  const user12 = await createUser('Lired', 'Lire');
  const user13 = await createUser('Kevin', 'Kev');
  const user14 = await createUser('Gordon', 'Gord');
  const user15 = await createUser('Terry', 'Ter');
  console.log({
    user1,
    user2,
    user3,
    user4,
    user5,
    user6,
    user7,
    user8,
    user9,
    user10,
    user11,
    user12,
    user13,
    user14,
    user15,
  });
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
