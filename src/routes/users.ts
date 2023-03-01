import express from 'express';
import multer from 'multer';
import {
  addGym,
  createSplit,
  deleteUser,
  editSplit,
  editUser,
  findNearByUsers,
  findUserById,
  getUserByToken,
  seeUser,
  updateAuthSteps,
} from '../controllers/users';
import { uploadUserImage } from '../controllers/userImages';

const userRouter = express.Router();

// get users closest to the current user in a radius using the user's gym location (long, lat).
userRouter.get(
  '/users/getNearByUsers/:token',
  async (req, res) => await findNearByUsers({ req, res })
);

userRouter.get(
  '/users/getByToken/:token',
  async (req, res) => await getUserByToken({ req, res })
);

/* Uploading the image to the storage bucket and then updating the user with the image url. */
const upload = multer({ dest: 'images' });
userRouter.post(
  '/users/images',
  upload.single('image'),
  async (req, res) => await uploadUserImage({ req, res })
);

// when a user scrolls on a user, they won't be able to see their profile again after swiping past.
userRouter.post(
  '/users/seeUser',
  async (req, res) => await seeUser({ req, res })
);

// edit a user
userRouter.put('/users', async (req, res) => await editUser({ req, res }));
userRouter.post(
  '/users/authSteps',
  async (req, res) => await updateAuthSteps({ req, res })
);

userRouter.post(
  '/users/addGym',
  async (req, res) => await addGym({ req, res })
);

// create a split for a user
userRouter.post(
  '/users/split',
  async (req, res) => await createSplit({ req, res })
);

// edit a split
userRouter.put(
  '/users/split',
  async (req, res) => await editSplit({ req, res })
);

userRouter.get(
  '/users/findById/:userId',
  async (req, res) => await findUserById({ req, res })
);

// delete a user
userRouter.delete(
  '/users/:token',
  async (req, res) => await deleteUser({ req, res })
);

export default userRouter;
