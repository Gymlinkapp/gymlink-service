import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client'; // Import your Prisma client instance

const prisma = new PrismaClient();

export async function createChat(request: FastifyRequest, reply: FastifyReply) {
  type RequestBdy = {
    name: string;
    userId: string;
    friend: string;
  };
  const { name, userId, friend } = request.body as RequestBdy;
  const chat = await prisma.chat.create({
    data: {
      name,
      participants: {
        // connect the user and the friend
        connect: [
          {
            id: userId,
          },
          {
            id: friend,
          },
        ],
      },
    },
  });
  reply.code(200).send({ message: 'success', chat: chat });
}

export async function getChats(request: FastifyRequest, reply: FastifyReply) {
  type RequestBdy = {
    userId: string;
  };
  const { userId } = request.params as RequestBdy;
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          id: userId,
        },
      },
    },
  });
  reply.code(200).send(chats);
}

export async function getChatById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  type RequestBdy = {
    chatId: string;
  };
  const { chatId } = request.params as RequestBdy;
  console.log(chatId);
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
    },
    select: {
      messages: {
        select: {
          content: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
  reply.code(200).send(chat);
}

export async function deleteChat(request: FastifyRequest, reply: FastifyReply) {
  type RequestBdy = {
    chatId: string;
  };
  const { chatId } = request.params as RequestBdy;

  try {
    // have to delete the messages first
    await prisma.message.deleteMany({
      where: {
        chatId: chatId,
      },
    });

    const chat = await prisma.chat.delete({
      where: {
        id: chatId,
      },
    });

    reply.code(200).send(chat);
  } catch (error) {
    console.log(error);
    reply.status(400).send({ message: 'error' });
  }
}
