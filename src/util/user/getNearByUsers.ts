import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();
export const findNearUsers = async (user: User): Promise<User[]> => {
  // get user's current gym
  const gym = await prisma.gym.findFirst({
    where: {
      // @ts-expect-error -- gymId is optional, but a user will always have a gymId.
      id: user.gymId,
    },
  });
  // get gym location
  const gymLocation = await prisma.location.findFirst({
    where: {
      id: gym?.locationId,
    },
  });
  if (!gymLocation) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      gym: {
        location: {
          lat: {
            gte: gymLocation.lat - 0.5,
            lte: gymLocation?.lat + 0.5,
          },
          long: {
            gte: gymLocation?.long - 0.5,
            lte: gymLocation?.long + 0.5,
          },
        },
      },
    },
  });

  // get user's friends
  /* const friends = await prisma.user.findUnique({ */
  /*   where: { */
  /*     id: user.id, */
  /*   }, */
  /*   include: { */
  /*     friends: true, */
  /*   }, */
  /* }); */
  /* return users.filter( */
  /*   (u) => u.id !== user.id && !friends?.friends?.some((f) => f.id === u.id) */
  /* ); */

  return users.filter((u) => u.id !== user.id);
};
