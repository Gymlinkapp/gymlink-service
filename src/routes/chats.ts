import fastify, { FastifyPluginAsync } from 'fastify';
import { PrismaClient, User } from '@prisma/client';
import {
  createChat,
  getChatById,
  getChats,
} from '../../src/controllers/chatControllers';

const chatRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.post(
    '/chats',
    async (request, reply) => await createChat(request, reply)
  );
  // get chats that a user is in
  fastify.get(
    '/chats/:userId',
    async (request, reply) => await getChats(request, reply)
  );
  // get chat by id
  fastify.get(
    '/chats/getById/:chatId',
    async (request, reply) => await getChatById(request, reply)
  );
  // delete chat
  fastify.delete('/chats/:chatId', async (req, res) => {});
};

export default chatRoutes;
