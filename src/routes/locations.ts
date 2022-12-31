import { PrismaClient, User } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();

const locationRouter = express.Router();

// get gym by id
locationRouter.get('/locations/:locationId', async (req, res) => {
  const { locationId } = req.params;
  const location = await prisma.location.findFirst({
    where: {
      id: locationId,
    },
  });
  res.status(200).json(location);
});

export default locationRouter;
