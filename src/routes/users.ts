import express from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '..';
import multer from 'multer';
import * as fs from 'fs';
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
  if (decoded) {
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
  } else {
    res.status(401).json({ message: 'Unauthorized' });
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
userRouter.post('/users/images', upload.single('image'), async (req, res) => {
  const { token, image } = req.body;

  const decoded = decode(token) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });

  if (user && user.images.length > 5) {
    res.status(400).json({ message: 'You can only have 5 images' });
  }
  // create a buffer from the base64 encoded image.
  const buffer = Buffer.from(image, 'base64');
  if (user) {
    const bucketPath = `user-${user.id}-${Math.random()}`;
    try {
      const { data, error } = await supabase.storage
        .from('user-images/public')
        .upload(bucketPath, buffer);
      if (error) {
        console.log(error);
      }
      if (data) {
        const url = await supabase.storage
          .from('user-images/public')
          .getPublicUrl(bucketPath);
        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            images: [...user.images, url.data.publicUrl],
          },
        });
        return res.status(200).json({ message: 'success' });
      }
    } catch (error) {
      console.log(error);

      res.status(500).json({ message: 'Internal Server Error' });
    }
    return res.status(200).json({ message: 'success' });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

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
