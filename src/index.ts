import express from 'express';
import { Server } from 'socket.io';
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

const io = new Server(
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on http://localhost:3000');
  })
);

io.on('connection', function (socket) {
  console.log('user connected');
  socket.on('chat message', function (msg) {
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});
