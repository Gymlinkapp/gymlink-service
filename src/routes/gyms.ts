import { PrismaClient, User } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();

const gymRouter = express.Router();

// get gym by id
gymRouter.get('/gyms/:gymId', async (req, res) => {
  const { gymId } = req.params;
  const gym = await prisma.gym.findFirst({
    where: {
      id: gymId,
    },
  });
  res.status(200).json(gym);
});

export default gymRouter;
