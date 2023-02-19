import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { decode } from 'jsonwebtoken';
import { JWT, Params } from 'src/types';

const prisma = new PrismaClient();

export const deleteUser = async ({ req, res }: Params) => {
  const { token } = req.params;
  const decoded = decode(token) as JWT;
  try {
    const user = await prisma.user.delete({
      where: {
        email: decoded.email,
      },
    });
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};
