import { Request, Response } from 'express';

export type JWT = {
  email: string;
  iat: number;
};

export type Params = {
  req: Request<{
    token: string;
  }>;
  res: Response;
};
