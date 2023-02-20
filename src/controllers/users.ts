import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { decode } from 'jsonwebtoken';
import { JWT, Params } from '../types';
import { findNearUsers } from '../util/user/getNearByUsers';

const prisma = new PrismaClient();

export const findNearByUsers = async ({ req, res }: Params) => {
  const { token } = req.params;

  const decoded = decode(token as string) as JWT;
  if (decoded) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          friendRequests: true,
        },
      });
      if (user) {
        const users = await findNearUsers(user);
        res.status(200).json(users);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const getUserByToken = async ({ req, res }: Params) => {
  const { token } = req.params;

  const decoded = decode(token as string) as JWT;
  if (decoded) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          split: true,
          chats: {
            include: {
              participants: true,
              user: true,
            },
          },
        },
      });
      if (user) {
        res.status(200).json(user);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const editUser = async ({ req, res }: Params) => {
  const { token } = req.body;

  // find user
  const decoded = decode(token) as JWT;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
      },
    });

    if (user && req.body.tags) {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          tags: req.body.tags,
          authSteps: req.body.authSteps,
        },
      });
      res.status(200).json(updatedUser);
    }

    // if the user is signedin
    if (user && !req.body.gym && !req.body.tags) {
      const updatedUser = await prisma.user.update({
        where: {
          email: decoded.email,
        },
        data: {
          ...req.body,
        },
      });
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    console.log(error);
  }
};

export const deleteUser = async ({ req, res }: Params) => {
  const { token } = req.params;
  const decoded = decode(token as string) as JWT;
  try {
    const user = await prisma.user.delete({
      where: {
        email: decoded.email,
      },
    });
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

export const createSplit = async ({ req, res }: Params) => {
  const { token, split } = req.body;
  const decoded = decode(token) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (user) {
    if (split.length < 1) {
      return res.status(400).json({
        message:
          "Empty exercises. You must fill each day, it's okay to take rest days!",
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
    res.status(200).json(newSplit);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const editSplit = async ({ req, res }: Params) => {
  const { token, split } = req.body;
  const decoded = decode(token) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });
  if (user) {
    if (split.length < 1) {
      return res.status(400).json({
        message:
          "Empty exercises. You must fill each day, it's okay to take rest days!",
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
    res.status(200).json(updatedSplit);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const addGym = async ({ req, res }: Params) => {
  const { token } = req.body;

  // find user
  const decoded = decode(token) as JWT;
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
          name: req.body.gym.name,
        },
      });

      if (gym) {
        // update the user with the gym
        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            bio: req.body.bio,
            longitude: req.body.longitude,
            latitude: req.body.latitude,
            authSteps: req.body.authSteps, // 4
            gym: {
              connect: {
                id: gym.id,
              },
            },
          },
        });
        res.status(200).json(updatedUser);
      } else {
        // gym doesn't exist so create it
        const newGym = await prisma.gym.create({
          data: {
            name: req.body.gym.name,
            location: {
              create: {
                lat: req.body.gym.latitude,
                long: req.body.gym.longitude,
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
            bio: req.body.bio,
            longitude: req.body.longitude,
            latitude: req.body.latitude,
            authSteps: req.body.authSteps,
            gym: {
              connect: {
                id: newGym.id,
              },
            },
          },
        });

        // new gym with user should work so return the newly updated user with the new gym.
        res.status(200).json(updatedUser);
      }
    } else {
      res.status(401).json({ message: 'Unable to join gym' });
    }
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const findUserById = async ({ req, res }: Params) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};
