import { PrismaClient, User } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';

const prisma = new PrismaClient();

const locationRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/locations/:locationId', async (req, res) => {
    type RequestBdy = {
      locationId: string;
    };
    const { locationId } = req.params as RequestBdy;
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
      },
    });
    res.code(200).send(location);
  });
};

export default locationRoutes;
