import express from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '..';
import multer from 'multer';
import { readFileSync } from 'fs';
import { User } from '@prisma/client';
import { decode } from 'jsonwebtoken';
import { JWT } from '../types';
import {
  isUserSignedIn,
  findNearUsers,
  newOrExistingGym,
} from '../util/user/helpers';

const prisma = new PrismaClient();

const userRouter = express.Router();

/*
 * hopefully this doesn't become an issue.
 * stores images locally and sets this as the default path.
 */
const upload = multer({ dest: 'images' });

/* 
  - create an endpoint to get all users.
  - get the current user 
  - only show other users who have their gym closest to the current user.
*/
userRouter.get('/users/:token', async (req, res) => {
  const { token } = req.params;

  const decoded = decode(token) as JWT;
  console.log(decoded);
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });
    if (user) {
      // const users = await findNearUsers(user);
      res.status(200).json(user);
    }
  } catch (error) {
    console.log(error);
  }
});

// userRouter.get('/users/:id', async (req, res) => {
//   const user = await prisma.user.findUnique({
//     where: {
//       id: req.params.id,
//     },
//   });
//   res.json(user);
// });

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

// edit a user
userRouter.post('/users/:id', async (req, res) => {
  const { id } = req.params;

  // find user
  const user = await prisma.user.findFirst({
    where: {
      id: id,
    },
  });

  newOrExistingGym(user?.gymId as string);

  // if the user is signedin
  let decodedEmail: JWT | null = null;
  if (user && (await isUserSignedIn(user.id)) && user.tempJWT) {
    decodedEmail = decode(user.tempJWT) as JWT;
  }

  // if the user is found and the email matches the email in the token
  if (user && decodedEmail && decodedEmail.email === user.email) {
    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        ...(req.body as User),
      },
    });
    res.json({ message: 'user updated', user: updatedUser });
  } else {
    res.json({ message: 'User is not signed in.' });
  }
});
export default userRouter;
