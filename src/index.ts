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
    socket.join(data.name);

    const messages = await prisma.chat.findUnique({
      where: {
        id: data.roomId,
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

    if (messages && messages.messages.length > 50) {
      socket.emit(
        'join-chat',
        [...messages.messages].slice(Math.max(messages.messages.length - 50, 0))
      );
    } else {
      socket.emit('join-chat', messages);
    }

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
            // chat: {
            //   select: {
            //     id: true,
            //     name: true,
            //   },
            // },
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
    console.log(chat);
    socket.broadcast.emit(
      'recieve-message',
      chat.messages[chat.messages.length - 1]
    );

    // socket
    //   .to(data.roomId)
    //   .emit('recieve-message', chat.messages[chat.messages.length - 1]);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});
