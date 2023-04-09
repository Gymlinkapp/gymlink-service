import {
  FastifyInstance,
  RouteOptions,
  FastifyRequest,
  FastifyReply,
  RequestGenericInterface,
} from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
export type JWT = {
  email: string;
  iat: number;
};

export interface RequestGeneric extends RequestGenericInterface {
  Params: {
    [key: string]: string;
  };
  Querystring: unknown;
  Body: {
    [key: string]: unknown;
  };
  Headers: unknown;
}

export type Params = {
  request: FastifyRequest<RequestGeneric>;
  reply: FastifyReply;
};

export type Router = {
  fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>;
  opts: RouteOptions;
};
