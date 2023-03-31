import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

import { createClient } from '@supabase/supabase-js';

import userRouter from './routes/users';
import authRouter from './routes/auth';
import { Chat, Location, PrismaClient } from '@prisma/client';
import chatsRouter from './routes/chats';
import gymRouter from './routes/gyms';
import locationRouter from './routes/locations';
import socialRouter from './routes/social';
const prisma = new PrismaClient();

export const supabase = createClient(
  `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`,
  process.env.SUPABASE_API_KEY || ''
);

const app = express();
app.use(express.json({ limit: '200mb' }));
app.use(cors());

app.use('/', userRouter);
app.use('/', authRouter);
app.use('/', chatsRouter);
app.use('/', gymRouter);
app.use('/', locationRouter);
app.use('/', socialRouter);

const server = http.createServer(app);
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
    const initialMessage = data.message;

    // send the initial message to the room
    await prisma.chat.update({
      where: {
        id: data.roomId,
      },
      data: {
        messages: {
          create: {
            content: initialMessage.content,
            sender: {
              connect: {
                id: data.message.sender.id,
              },
            },
          },
        },
      },
    });

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

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});
