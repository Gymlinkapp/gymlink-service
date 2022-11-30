import { PrismaClient, User } from '@prisma/client';
import { decode } from 'punycode';
import { JWT } from '../../types';

const prisma = new PrismaClient();

export async function isUserSignedIn(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user && user.tempJWT && user.tempJWT?.length > 0) {
    return true;
  }

  return false;
}

export async function getUserFromJWT(token: string): Promise<User | null> {
  const decoded = decode(token) as unknown as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  return user;
}

// this function should return users who are closest to farthest from the user or the user's gym.
export async function findNearUsers(user: User): Promise<User[]> {
  try {
    // get current user
    const currentUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    // get users
    /* Finding all users who have the same gymId as the current user. */
    const users = await prisma.user.findMany({
      where: {
        gymId: currentUser?.gymId,
        // not including the current user in the list of users.
        NOT: {
          id: currentUser?.id,
        },
      },
      orderBy: {
        gym: {
          location: {
            // lat: user.gym.location.lat > currentUser?.gym.location.lat ? 'asc' : 'desc',
            long: 'asc',
          },
        },
      },
    });

    return users;
  } catch (error) {
    console.log(error);
  }
  return [];
}

export async function newOrExistingGym(gymId: string): Promise<boolean> {
  try {
    const gym = await prisma.gym.findFirst({
      where: {
        id: gymId,
      },
    });

    // if the gym exists, return true.
    if (gym) {
      return true;
    }
  } catch (error) {
    console.log(error);
  }

  return false;
}
