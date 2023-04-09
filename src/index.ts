import Fastify from 'fastify';
import { Server } from 'socket.io';
import http from 'http';
import cors from '@fastify/cors';

import { createClient } from '@supabase/supabase-js';

import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import { Chat, PrismaClient } from '@prisma/client';
import socialRoutes from './routes/social';
import chatRoutes from './routes/chats';
import gymRoutes from './routes/gyms';
import locationRoutes from './routes/locations';
const prisma = new PrismaClient();

export const supabase = createClient(
  `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`,
  process.env.SUPABASE_API_KEY || ''
);

const app = Fastify({ logger: true });
app.register(cors);

app.register(userRoutes, { prefix: '/' });
app.register(authRoutes, { prefix: '/' });
app.register(chatRoutes, { prefix: '/' });
app.register(gymRoutes, { prefix: '/' });
app.register(locationRoutes, { prefix: '/' });
app.register(socialRoutes, { prefix: '/' });

const server = http.createServer((req, res) => {
  app.ready((err) => {
    if (err) throw err;
    app.server.emit('request', req, res);
  });
});
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);

  socket.on('join-chat', async (data: any) => {
    socket.join(data.roomName);

    // send the initial message to the room
    if (data.message) {
      await prisma.chat.update({
        where: {
          id: data.roomId,
        },
        data: {
          messages: {
            create: {
              content: data.message.content,
              sender: {
                connect: {
                  id: data.message.sender.id,
                },
              },
            },
          },
        },
      });
    }

    const messages = await prisma.chat.findUnique({
      where: {
        id: data.roomId,
      },
      select: {
        messages: {
          select: {
            createdAt: true,
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
    // when a user joins the chat it should emit the latest 50 messages and use the createdDate to show them in newest to latest
    if (messages && messages.messages.length > 50) {
      const sortedMessages = messages.messages.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      socket.emit(
        'messages',
        [...sortedMessages].slice(Math.max(sortedMessages.length - 50, 0))
      );
    } else {
      socket.emit('messages', messages?.messages);
    }

    socket.on('leave-chat', (data: Chat) => {
      console.log('leave-chat: ', data);
      socket.leave(data.id);
      socket.to(data.id).emit('leave-chat', data);
    });
  });

  // listen to a chat-messge
  socket.on('chat-message', async (data) => {
    const chat = await prisma.chat.update({
      where: {
        id: data.roomId,
      },
      data: {
        messages: {
          create: {
            content: data.content,
            sender: {
              connect: {
                id: data.sender.id,
              },
            },
          },
        },
      },
      select: {
        messages: {
          select: {
            content: true,
            id: true,
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

    // gets the last message
    const message = chat.messages[chat.messages.length - 1];
    socket.to(data.roomName).emit('recieve-message', message);
  });

  // add functionality to listen for typing
  socket.on('typing', (data) => {
    const { isTyping, roomName }: { isTyping: boolean; roomName: string } =
      data;
    console.log('typing: ', data);
    socket.broadcast.to(roomName).emit('typing', isTyping);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const host =
  process.env.ENV === 'development'
    ? process.env.DEVELOPMENT_HOST
    : 'localhost';
const start = async () => {
  try {
    await app.listen({ port: 3000, host: host });
    app.log.info(`Server listening on ${app.server.address()}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
