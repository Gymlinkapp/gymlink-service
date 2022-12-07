import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

import { createClient } from '@supabase/supabase-js';

import userRouter from './routes/users';
import authRouter from './routes/auth';

export const supabase = createClient(
  `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`,
  process.env.SUPABASE_API_KEY || ''
);

const app = express();
app.use(express.json({ limit: '200mb' }));
app.use(cors());

app.use('/', userRouter);
app.use('/', authRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('a user connected: ', socket.id);

  // listen to a chat-messge
  socket.on('chat-message', (data) => {
    console.log('message: ', data);
    socket.broadcast.emit('recieve-message', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});
