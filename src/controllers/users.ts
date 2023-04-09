import { Gym, Prisma, PrismaClient, User } from '@prisma/client';
import { JWT, Params } from '../types';
import { findNearUsers } from '../util/user/getNearByUsers';
import { decode } from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Find all users that are not in the current user's chat list and are not the current user, and add
 * them to the current user's feed
 * @param {Params}  - Params - This is the type of the parameters that are passed to the function.
 */
export const findNearByUsers = async ({ request, reply }: Params) => {
  const { token } = request.params;

  const decoded = decode(token as string) as JWT;
  if (decoded) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          chats: {
            select: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });
      if (user) {
        const users = await prisma.user.findMany({
          where: {
            id: {
              notIn: user.chats.map((chat) => chat.user?.id as string),
            },
            AND: {
              id: {
                not: user.id,
              },
              chats: {
                none: {
                  user: {
                    id: user.id,
                  },
                },
              },
            },
          },
        });

        const userWithFeed = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            feed: {
              connect: users.map((user) => ({
                id: user.id,
              })),
            },
          },
          include: {
            feed: true,
            split: true,
          },
        });

        reply.code(200).send(userWithFeed.feed);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export const filterFeed = async ({ request, reply }: Params) => {
  const { token } = request.body;

  const decoded = decode(token as string) as JWT;
  if (decoded) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          feed: true,
        },
      });
      if (user) {
        // e.g. request.body = { filters: [ { filter: "goingToday", value: true }, { filter: "workout", value: ["back"] }, { filter: "gender", value: ["male", "female"] } ] }

        reply.code(200).send({
          feed: [],
        });
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export const getUserByToken = async ({ request, reply }: Params) => {
  const { token } = request.params;

  const decoded = decode(token as string) as JWT;
  if (decoded) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          split: true,
          feed: true,
          chats: {
            include: {
              messages: true,
              participants: {
                include: {
                  split: true,
                  chats: true,
                  gym: true,
                },
              },
              user: true,
            },
          },
        },
      });
      if (user) {
        reply.code(200).send(user);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export const updateAuthSteps = async ({ request, reply }: Params) => {
  const { token } = request.body;

  const decoded = decode(token as string) as JWT;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          authSteps: request.body.authSteps as number,
        },
      });
      reply.code(200).send(updatedUser);
    }
  } catch (error) {
    console.log(error);
  }
};

export const editUser = async ({ request, reply }: Params) => {
  const { token } = request.body;

  // find user
  const decoded = decode(token as string) as JWT;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
      },
    });

    if (user && request.body.tags) {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          tags: request.body.tags,
          authSteps: request.body.authSteps as number,
        },
      });
      reply.code(200).send(updatedUser);
    } else {
      const updatedUser = await prisma.user.update({
        where: {
          email: decoded.email,
        },
        data: {
          // ...request.body except token,
          ...request.body,
        },
      });
      reply.code(200).send(updatedUser);
    }

    // if the user is signedin
  } catch (error) {
    console.log(error);
  }
};
export const editUserDashboard = async ({ request, reply }: Params) => {
  const { id } = request.params;

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        // ...request.body except token,
        ...request.body,
      },
    });
    reply.code(200).send(updatedUser);

    // if the user is signedin
  } catch (error) {
    console.log(error);
  }
};

export const deleteUser = async ({ request, reply }: Params) => {
  const { token } = request.params;
  const decoded = decode(token as string) as JWT;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
      },
    });

    if (user) {
      // delete chats
      await prisma.chat.deleteMany({
        where: {
          participants: {
            some: {
              userId: user.id,
            },
          },
        },
      });

      // delete messages
      await prisma.message.deleteMany({
        where: {
          chat: {
            participants: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      });

      // delete user
      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });
    }
    reply.send(user);
  } catch (error) {
    console.log(error);
  }
};

// replyet user's state
export const replyetUser = async ({ request, reply }: Params) => {
  const { token } = request.params;
  const decoded = decode(token as string) as JWT;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
      },
    });

    if (user) {
      // delete chats
      await prisma.chat.deleteMany({
        where: {
          participants: {
            some: {
              userId: user.id,
            },
          },
        },
      });

      // delete messages
      await prisma.message.deleteMany({
        where: {
          chat: {
            participants: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      });
    }
    reply.send(user);
  } catch (error) {
    console.log(error);
  }
};

export const createSplit = async ({ request, reply }: Params) => {
  const { token } = request.body;
  const { split } = request.body as { split: any[] };
  const decoded = decode(token as string) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (user) {
    if (split.length < 1) {
      return reply.code(400).send({
        message:
          "Empty exercises. You must fill each day, it's okay to take replyt days!",
      });
    }
    const newSplit = await prisma.split.create({
      data: {
        User: {
          connect: {
            id: user.id,
          },
        },
        // handle empty days on frontend by not allowing user to submit
        monday: split[0]?.exercises || [],
        tuesday: split[1]?.exercises || [],
        wednesday: split[2]?.exercises || [],
        thursday: split[3]?.exercises || [],
        friday: split[4]?.exercises || [],
        saturday: split[5]?.exercises || [],
        sunday: split[6]?.exercises || [],
      },
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        authSteps: 6,
      },
    });
    reply.code(200).send(newSplit);
  } else {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export const editSplit = async ({ request, reply }: Params) => {
  const { token } = request.body;
  const { split } = request.body as { split: any[] };
  const decoded = decode(token as string) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (user) {
    if (split.length < 1) {
      return reply.code(400).send({
        message:
          "Empty exercises. You must fill each day, it's okay to take replyt days!",
      });
    }
    const updatedSplit = await prisma.split.update({
      where: {
        id: user.splitId as string,
      },
      data: {
        // handle empty days on frontend by not allowing user to submit
        monday: split[0]?.exercises || [],
        tuesday: split[1]?.exercises || [],
        wednesday: split[2]?.exercises || [],
        thursday: split[3]?.exercises || [],
        friday: split[4]?.exercises || [],
        saturday: split[5]?.exercises || [],
        sunday: split[6]?.exercises || [],
      },
    });
    reply.code(200).send(updatedSplit);
  } else {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export const addGym = async ({ request, reply }: Params) => {
  const { token } = request.body;
  const { name } = request.body as Gym;

  // find user
  const decoded = decode(token as string) as JWT;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
      },
    });

    // if there is a user:
    if (user) {
      // get gyms and check if the gym exists
      const gym = await prisma.gym.findFirst({
        where: {
          name: name,
        },
      });

      if (gym) {
        // update the user with the gym
        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            bio: request.body.bio as string,
            longitude: request.body.longitude as number,
            latitude: request.body.latitude as number,
            authSteps: request.body.authSteps as number, // 4
            gym: {
              connect: {
                id: gym.id,
              },
            },
          },
        });

        const users = await findNearUsers(updatedUser);

        const updatedUser2 = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            feed: {
              connect: users.map((user) => ({
                id: user.id,
              })),
            },
          },
        });
        reply.code(200).send(updatedUser2);
      } else {
        // gym doesn't exist so create it
        const newGym = await prisma.gym.create({
          data: {
            name: name,
            location: {
              create: {
                // @ts-expect-error - gym location is coming from body
                lat: request.body.gym.latitude,
                // @ts-expect-error - gym location is coming from body
                long: request.body.gym.longitude,
              },
            },
          },
        });

        // update the user with the newly created gym
        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            bio: request.body.bio as string,
            // @ts-expect-error - gym location is coming from body
            longitude: request.body.longitude,
            // @ts-expect-error - gym location is coming from body
            latitude: request.body.latitude,
            authSteps: request.body.authSteps as number,
            gym: {
              connect: {
                id: newGym.id,
              },
            },
          },
        });

        const users = await findNearUsers(updatedUser);

        const updatedUser2 = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            feed: {
              connect: users.map((user) => ({
                id: user.id,
              })),
            },
          },
        });

        // new gym with user should work so return the newly updated user with the new gym.
        reply.code(200).send(updatedUser2);
      }
    } else {
      reply.code(401).send({ message: 'Unable to join gym' });
      console.log('nope');
    }
  } catch {
    reply.code(401).send({ message: 'Unauthorized' });
    console.log('nope');
  }
};

export const findUserById = async ({ request, reply }: Params) => {
  const { userId } = request.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        split: true,
      },
    });
    reply.send(user);
  } catch (error) {
    console.log(error);
  }
};

/**
 * If the user is found, update the seen array with the seen user id if the seen user id is not already
 * in the seen array
 * @param {Params}  - Params - this is the type of the parameters that are passed into the function.
 */
export const seeUser = async ({ request, reply }: Params) => {
  const { token, seenUserId } = request.body;
  const decoded = decode(token as string) as JWT;
  try {
    // get user
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      include: {
        feed: true,
      },
    });
    if (user) {
      // if there is a user found, update the seen array with the seen user id if the seen user id is not already in the seen array
      if (!user.seen.includes(seenUserId as string)) {
        const userWithSeenOther = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            seen: { push: seenUserId as string },
          },
          include: {
            feed: true,
          },
        });

        // update the users feed to not include the seen user if the seen user is in the seen array. This will remove the seen user from the feed.

        // create the new feed without the seen user
        const newFeed = userWithSeenOther.feed.filter((u) => {
          // return the new feed without the seen user
          return u.id !== seenUserId;
        });

        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            feed: {
              set: newFeed.map((u) => {
                return { id: u.id };
              }),
            },
          },
        });

        reply.code(200).send({ user: updatedUser });
      }
    } else {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.log(error);
  }
};

export const allUsers = async ({ request, reply }: Params) => {
  const { page } = request.params;
  try {
    const users = await prisma.user.findMany({});
    // pagination for users
    // const users = await prisma.user.findMany({
    //   skip: (Number(page) - 1) * 10,
    //   take: 10,
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // });
    reply.send(users);
  } catch (error) {
    console.log(error);
  }
};

export const dashboardUserDelete = async ({ request, reply }: Params) => {
  const { id } = request.params;
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
    });

    if (user) {
      // delete chats
      await prisma.chat.deleteMany({
        where: {
          participants: {
            some: {
              userId: user.id,
            },
          },
        },
      });

      // delete messages
      await prisma.message.deleteMany({
        where: {
          chat: {
            participants: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      });

      // delete user
      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });
    }
    reply.send(user);
  } catch (error) {
    console.log(error);
  }
};
