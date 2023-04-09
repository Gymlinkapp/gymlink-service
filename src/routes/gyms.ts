import { PrismaClient, User } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';

const prisma = new PrismaClient();

const gymRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/gyms/:gymId', async (request, reply) => {
    type RequestBdy = {
      gymId: string;
    };
    const { gymId } = request.params as RequestBdy;
    const gym = await prisma.gym.findFirst({
      where: {
        id: gymId,
      },
    });
    reply.code(200).send(gym);
  });
};

export default gymRoutes;
