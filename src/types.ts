import { Request, Response } from 'express';
export type JWT = {
  email: string;
  iat: number;
};

export type Params = {
  req: Request<{
    [key: string]: string;
  }>;
  res: Response;
};
