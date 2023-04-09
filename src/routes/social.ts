import { FastifyPluginAsync } from 'fastify';
import { LinkWithUser } from '../controllers/social';

const socialRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.post('/social/link', (request, reply) =>
    LinkWithUser(request, reply)
  );
};
// a user will be able to create a `link` with a user (which is just a chat)

export default socialRoutes;
