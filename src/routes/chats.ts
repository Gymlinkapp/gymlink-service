import { PrismaClient, User } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();

const chatsRouter = express.Router();

// create chat
chatsRouter.post('/chats', async (req, res) => {
  console.log(req.body);
  const { name, userId, friend } = req.body;
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
  res.status(200).json({ message: 'success', chat: chat });
});

// get chats that a user is in
chatsRouter.get('/chats/:userId', async (req, res) => {
  const { userId } = req.params;
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          id: userId,
        },
      },
    },
  });
  res.status(200).json(chats);
});

// get chat by id
chatsRouter.get('/chats/getById/:chatId', async (req, res) => {
  const { chatId } = req.params;
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
  res.status(200).json(chat);
});

// delete chat
chatsRouter.delete('/chats/:chatId', async (req, res) => {
  const { chatId } = req.params;

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

    res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'error' });
  }
});

export default chatsRouter;
