import express from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '..';
import multer from 'multer';
import { readFileSync } from 'fs';
import { User } from '@prisma/client';

const prisma = new PrismaClient();

const userRouter = express.Router();

/*
 * hopefully this doesn't become an issue.
 * stores images locally and sets this as the default path.
 */
const upload = multer({ dest: 'images' });

/* This is a basic get request to get all users and a specific user. */
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

// https://aboutreact.com/file-uploading-in-react-native/
// https://github.com/supabase/supabase/issues/1257

/* Uploading the image to the storage bucket and then updating the user with the image url. */
userRouter.post(
  '/users/:id/images',
  upload.single('images'),
  async (req, res) => {
    const { id } = req.params;
    const { path } = req.file as Express.Multer.File;
    const file = readFileSync(path);
    const bucketPath = `user-${id}-${req.file?.originalname}.png`;
    const { error } = await supabase.storage
      .from('user-images/public')
      .upload(bucketPath, file);
    if (error) {
      res.status(500).json({ error });
    } else {
      const url = await supabase.storage
        .from('user-images/public')
        .getPublicUrl(bucketPath);

      // add image (as url) to user
      const user = (await prisma.user.findFirst({
        where: {
          id: id,
        },
      })) as User;
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
