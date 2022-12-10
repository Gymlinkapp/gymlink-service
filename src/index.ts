import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

import { createClient } from '@supabase/supabase-js';

import userRouter from './routes/users';
import authRouter from './routes/auth';
import { Chat, PrismaClient } from '@prisma/client';
import chatsRouter from './routes/chats';
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);

  socket.on('join-chat', (data: Chat) => {
    console.log('join-chat: ', data);
    socket.join(data.name);

    // would want to save the room as a Chat object in the database
    const chat = prisma.chat.create({
      data: {
        name: data.name,
        id: data.id,
      },
    });

    socket.broadcast.emit('join-chat', data);

    socket.on('leave-chat', (data: Chat) => {
      console.log('leave-chat: ', data);
      socket.leave(data.id);
      socket.broadcast.emit('leave-chat', data);
    });
  });

  // listen to a chat-messge
  socket.on('chat-message', async (data) => {
    console.log('message: ', data);
    // save the message to the chat in the database
    // socket.to(data.room).emit('recieve-message', data);

    const chat = await prisma.chat.update({
      where: {
        id: data.roomId,
      },
      data: {
        messages: {
          create: {
            content: data.message,
            sender: {
              connect: {
                id: data.user.id,
              },
            },
          },
        },
      },
    });
    console.log(chat);
    socket.broadcast.emit('recieve-message', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});
