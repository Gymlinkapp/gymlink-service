import { PrismaClient } from '@prisma/client';
import express from 'express';
import authRouter from './routes/auth';
import userRouter from './routes/users';
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

export const supabase = createClient(
  `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`,
  process.env.SUPABASE_API_KEY || ''
);

const app = express();
app.use('/', userRouter);
app.use('/', authRouter);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
