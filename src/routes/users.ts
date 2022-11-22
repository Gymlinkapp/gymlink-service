import express from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '..';
import multer from 'multer';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

const userRouter = express.Router();

const upload = multer({ dest: 'images' });

userRouter.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: {
      id: 'desc',
    },
  });
  res.json(users);
});

userRouter.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.id,
    },
  });
  res.json(user);
});

// add images
// https://aboutreact.com/file-uploading-in-react-native/
// https://github.com/supabase/supabase/issues/1257

// upload images to supabase storage
userRouter.post(
  '/users/:id/images',
  upload.single('images'),
  async (req, res) => {
    const { id } = req.params;
    const { path } = req.file as Express.Multer.File;
    const file = readFileSync(path);
    const bucketPath = `user-${id}-${req.file?.originalname}.png`;
    const { data, error } = await supabase.storage
      .from('user-images/public')
      .upload(bucketPath, file);
    if (error) {
      res.status(500).json({ error });
    } else {
      const url = await supabase.storage
        .from('user-images/public')
        .getPublicUrl(bucketPath);

      // update user with image url
      const user = (await prisma.user.findFirst({
        where: {
          id: id,
        },
      })) as any;
      await prisma.user.update({
        where: {
          id: id,
        },
        data: {
          images: user.images.concat(url.data.publicUrl),
        },
      });
      res.json(user);
    }
  }
);

export default userRouter;
