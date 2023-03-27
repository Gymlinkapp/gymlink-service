import { PrismaClient } from '@prisma/client';
import { JWT, Params } from '../types';
import { decode } from 'jsonwebtoken';

const prisma = new PrismaClient();

export const LinkWithUser = async ({ req, res }: Params) => {
  // find the friend request
  const { userId, linkedUserId, token } = req.body;
  try {
    const decoded = decode(token) as JWT;
    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'You are not authorized' });
      return;
    }

    const fromUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });
    const toUser = await prisma.user.findUnique({
      where: {
        id: linkedUserId,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // if users have a chat already together, don't create a new one
    const chat = await prisma.chat.findFirst({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
        AND: {
          participants: {
            some: {
              id: linkedUserId,
            },
          },
        },
      },
    });

    if (chat) {
      res.status(200).json({ chat });
      return;
    }
    if (fromUser && toUser) {
      // create a chat between the two users
      const chat = await prisma.chat.create({
        data: {
          name: `${fromUser.firstName} ${fromUser.lastName} and ${toUser.firstName} ${toUser.lastName}`,
          participants: {
            connect: [{ id: userId }, { id: linkedUserId }],
          },
        },
      });
      res.status(200).json({ chat });
      return;
    }

    if (!fromUser || !toUser) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    if (userId === linkedUserId) {
      res.status(400).json({ message: 'You cannot link with yourself' });
      return;
    }
  } catch (error) {
    console.log(error);
  }
};
