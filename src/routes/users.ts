import express from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '..';
import multer from 'multer';
import * as fs from 'fs';
import { User } from '@prisma/client';
import { decode } from 'jsonwebtoken';
import { JWT } from '../types';

const prisma = new PrismaClient();

const userRouter = express.Router();

/*
 * hopefully this doesn't become an issue.
 * stores images locally and sets this as the default path.
 */
const upload = multer({ dest: 'images' });

// get users closest to the current user in a radius using the user's gym location (long, lat).
const findNearUsers = async (user: User) => {
  // get user's current gym
  const gym = await prisma.gym.findFirst({
    where: {
      // @ts-expect-error -- gymId is optional, but a user will always have a gymId.
      id: user.gymId,
    },
  });
  // get gym location
  const gymLocation = await prisma.location.findFirst({
    where: {
      id: gym?.locationId,
    },
  });
  const users = await prisma.user.findMany({
    where: {
      gym: {
        location: {
          lat: {
            gte: gymLocation?.lat! - 0.5,
            lte: gymLocation?.lat! + 0.5,
          },
          long: {
            gte: gymLocation?.long! - 0.5,
            lte: gymLocation?.long! + 0.5,
          },
        },
      },
    },
    include: {
      friends: true,
    },
  });

  // return users.filter((u) => u.id !== user.id && !user.friends?.some((f) => f.id === u.id));
  // return if the user is not the current user and the user is not already a friend.
  // get current user's friends
  const friends = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      friends: true,
    },
  });
  return users.filter(
    (u) => u.id !== user.id && !friends?.friends?.some((f) => f.id === u.id)
  );
};

userRouter.get('/users/getNearByUsers/:token', async (req, res) => {
  const { token } = req.params;

  const decoded = decode(token) as JWT;
  console.log(decoded);
  if (decoded) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
        include: {
          friendRequests: true,
        },
      });
      if (user) {
        const users = await findNearUsers(user);
        res.status(200).json(users);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

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
            authSteps: 4,
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
  console.log('before anything', req.body);

  // find user
  const decoded = decode(token) as JWT;
  const user = await prisma.user.findFirst({
    where: {
      email: decoded.email,
    },
  });
  if (user && req.body.gym) {
    console.log('user', user);
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
          authSteps: req.body.authSteps,
          gym: {
            connect: {
              id: gym.id,
            },
          },
        },
      });
      res.status(200).json(updatedUser);
    } else {
      console.log('new gym here');
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
          // if there is a gym in the body, the user has completed the auth step 4, so we update the auth step to 5, if there is tags in the body then we update the auth step to 6.
          authSteps: req.body.authSteps,
          gym: {
            connect: {
              id: newGym.id,
            },
          },
        },
      });
      console.log('done', updatedUser);
      res.status(200).json(updatedUser);
    }
  }

  // if the user is signedin
  // let decodedEmail: JWT | null = null;
  if (user && !req.body.gym) {
    // decodedEmail = decode(token) as JWT;

    if (decoded) {
      const updatedUser = await prisma.user.update({
        where: {
          email: decoded.email,
        },
        data: {
          ...req.body,
        },
      });
      res.status(200).json(updatedUser);
    }
  }
});

userRouter.get('/users/findById/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  res.json(user);
});

// delete a user
userRouter.delete('/users/:token', async (req, res) => {
  const { token } = req.params;
  console.log(token);

  const decoded = decode(token) as JWT;
  const user = await prisma.user.delete({
    where: {
      email: decoded.email,
    },
  });
  res.json(user);
});
export default userRouter;
