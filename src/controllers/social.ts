import { PrismaClient } from '@prisma/client';
import { JWT } from '../types';
import { decode } from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify';

const prisma = new PrismaClient();

export const LinkWithUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  type RequestBdy = {
    fromUserId: string;
    toUserId: string;
    token: string;
  };
  const { fromUserId, toUserId, token } = request.body as RequestBdy;
  try {
    const decoded = decode(token) as JWT;
    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });

    // check if the user is authorized with a token
    if (!user) {
      reply.code(401).send({ message: 'You are not authorized' });
      return;
    }

    const fromUser = await prisma.user.findUnique({
      where: {
        id: fromUserId,
      },
      select: {
        feed: true,
        firstName: true,
        lastName: true,
        id: true,
        images: true,
      },
    });
    const toUser = await prisma.user.findUnique({
      where: {
        id: toUserId,
      },
      select: {
        feed: true,
        firstName: true,
        lastName: true,
        id: true,
        images: true,
      },
    });

    // if users have a chat already together, don't create a new one
    const chat = await prisma.chat.findFirst({
      where: {
        participants: {
          some: {
            id: fromUserId,
          },
        },
        AND: {
          participants: {
            some: {
              id: toUserId,
            },
          },
        },
      },
    });

    if (chat) {
      reply.code(200).send({ chat });
      return;
    }
    if (fromUser && toUser) {
      // create a chat between the two users
      const chat = await prisma.chat.create({
        data: {
          name: `${fromUser.firstName} ${fromUser.lastName} and ${toUser.firstName} ${toUser.lastName}`,
          participants: {
            connect: [{ id: fromUserId }, { id: toUserId }],
          },
        },
        select: {
          participants: {
            select: {
              id: true,
              images: true,
              firstName: true,
              lastName: true,
            },
          },
          name: true,
          id: true,
        },
      });

      // filter the feed of the user's in the chat to not include the user
      const fromUsersFeed = fromUser.feed.filter(
        (user) => user.id !== toUserId
      );
      await prisma.user.update({
        where: {
          id: fromUserId,
        },
        data: {
          feed: {
            set: fromUsersFeed.map((user) => ({ id: user.id })),
          },
        },
      });

      const toUsersFeed = toUser.feed.filter((user) => user.id !== fromUserId);
      await prisma.user.update({
        where: {
          id: toUserId,
        },
        data: {
          feed: {
            // filter the toUser's feed to not include the fromUser
            set: toUsersFeed.map((user) => ({ id: user.id })),
          },
        },
      });
      reply.code(200).send({
        chat: {
          name: chat.name,
          id: chat.id,
          participants: {
            toUser: {
              id: toUser.id,
              firstName: toUser.firstName,
              lastName: toUser.lastName,
              images: toUser.images,
            },
          },
        },
      });

      return;
    }

    if (!fromUser || !toUser) {
      reply.code(400).send({ message: 'User not found' });
      return;
    }

    if (fromUserId === toUserId) {
      reply.code(400).send({ message: 'You cannot link with yourself' });
      return;
    }
  } catch (error) {
    console.log(error);
  }
};
