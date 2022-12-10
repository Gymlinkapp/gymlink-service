import { PrismaClient, User } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();

const chatsRouter = express.Router();

// create chat
chatsRouter.post('/chats', async (req, res) => {
  console.log(req.body);
  const { name, userId, people } = req.body;
  const chat = await prisma.chat.create({
    data: {
      name,
      id: userId,
      participants: {
        connect: [
          {
            id: userId,
          },

          ...people.map((person: User) => {
            return {
              id: person.id,
            };
          }),
        ],
      },
    },
  });
  res.status(200).json(chat);
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
  console.log(chats);
  res.status(200).json(chats);
});

export default chatsRouter;
