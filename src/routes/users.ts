import express from 'express';
import multer from 'multer';
import {
  addGym,
  allUsers,
  createSplit,
  dashboardUserDelete,
  deleteUser,
  editSplit,
  editUser,
  editUserDashboard,
  filterFeed,
  findNearByUsers,
  findUserById,
  getUserByToken,
  seeUser,
  updateAuthSteps,
} from '../controllers/users';
import { uploadUserImage } from '../controllers/userImages';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { RequestGeneric, Router } from '../../src/types';

// const userRouter = express.Router();

const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<RequestGeneric>(
    '/users/getNearByUsers/:token',
    async (request, reply) => await findNearByUsers({ request, reply })
  );

  fastify.post<RequestGeneric>(
    '/users/filter',
    async (request, reply) => await filterFeed({ request, reply })
  );

  fastify.get<RequestGeneric>(
    '/users/getByToken/:token',
    async (request, reply) => await getUserByToken({ request, reply })
  );

  // To handle file uploads in Fastify, you can use the 'fastify-multer' plugin
  // First, install it: npm install fastify-multer
  // import fastifyMulter from 'fastify-multer';
  // const upload = fastifyMulter({ dest: 'images' }).single('image');

  // fastify.register(upload);

  fastify.post<RequestGeneric>(
    '/users/images',
    async (request, reply) => await uploadUserImage({ request, reply })
  );

  fastify.post<RequestGeneric>(
    '/users/seeUser',
    async (request, reply) => await seeUser({ request, reply })
  );

  fastify.put<RequestGeneric>(
    '/users',
    async (request, reply) => await editUser({ request, reply })
  );

  fastify.post<RequestGeneric>(
    '/users/authSteps',
    async (request, reply) => await updateAuthSteps({ request, reply })
  );

  fastify.post<RequestGeneric>(
    '/users/addGym',
    async (request, reply) => await addGym({ request, reply })
  );

  fastify.post<RequestGeneric>(
    '/users/split',
    async (request, reply) => await createSplit({ request, reply })
  );

  fastify.put<RequestGeneric>(
    '/users/split',
    async (request, reply) => await editSplit({ request, reply })
  );

  fastify.get<RequestGeneric>(
    '/users/findById/:userId',
    async (request, reply) => await findUserById({ request, reply })
  );

  fastify.delete<RequestGeneric>(
    '/users/:token',
    async (request, reply) => await deleteUser({ request, reply })
  );

  fastify.get<RequestGeneric>(
    '/allUsers',
    async (request, reply) => await allUsers({ request, reply })
  );

  fastify.delete<RequestGeneric>(
    '/dashboardUserDelete/:id',
    async (request, reply) => await dashboardUserDelete({ request, reply })
  );

  fastify.put<RequestGeneric>(
    '/dashboardEditUser/:id',
    async (request, reply) => await editUserDashboard({ request, reply })
  );
};

export default userRoutes;
