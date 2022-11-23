import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function isUserSignedIn(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user && user.tempJWT && user.tempJWT?.length > 0) {
    return true;
  }

  return false;
}
