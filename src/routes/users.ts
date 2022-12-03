import express from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '..';
import multer from 'multer';
import * as fs from 'fs';
import { User } from '@prisma/client';
import { decode } from 'jsonwebtoken';
import { JWT } from '../types';
//

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
userRouter.post('/users/:token', async (req, res) => {
  const { token } = req.params;

  // find user
  const user = await prisma.user.findFirst({
    where: {
      tempJWT: token,
    },
  });

  if (user && req.body.gym) {
    console.log(req.body);
    // get gyms and check if the gym exists
    const gym = await prisma.gym.findFirst({
      where: {
        name: req.body.gym.name,
      },
    });

    if (gym) {
      // update the user with the gym
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          bio: req.body.bio,
          longitude: req.body.longitude,
          latitude: req.body.latitude,
          gym: {
            connect: {
              id: gym.id,
            },
          },
        },
      });
      res.status(200).json(updatedUser);
    } else {
      // gym doesn't exist so create it
      const newGym = await prisma.gym.create({
        data: {
          name: req.body.gym.name,
          location: {
            create: {
              lat: req.body.gym.latitude,
              long: req.body.gym.longitude,
            },
          },
        },
      });

      // update the user with the gym
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          bio: req.body.bio,
          longitude: req.body.longitude,
          latitude: req.body.latitude,
          gym: {
            connect: {
              id: newGym.id,
            },
          },
        },
      });
      res.status(200).json(updatedUser);
    }
  }

  // if the user is signedin
  let decodedEmail: JWT | null = null;
  if (user && !req.body.gym) {
    decodedEmail = decode(token) as JWT;

    if (decodedEmail) {
      const updatedUser = await prisma.user.update({
        where: {
          email: decodedEmail.email,
        },
        data: {
          ...req.body,
        },
      });
      res.status(200).json(updatedUser);
    }
  }
});
export default userRouter;
