import { PrismaClient } from '@prisma/client';
import { decode } from 'jsonwebtoken';
import { JWT, Params } from 'src/types';
import { supabase } from '..';

const prisma = new PrismaClient();

export const uploadUserImage = async ({ request, reply }: Params) => {
  const { token, image } = request.body;

  const decoded = decode(token as string) as JWT;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });

    if (user && user.images.length > 5) {
      reply.code(400).send({ message: 'You can only have 5 images' });
    }

    // create a buffer from the base64 encoded image.
    const buffer = Buffer.from(image as any, 'base64');
    if (user) {
      const bucketPath = `user-${user.id}-${Math.random()}`;
      try {
        const { data, error } = await supabase.storage
          .from('user-images/public')
          .upload(bucketPath, buffer);
        if (error) {
          console.log(error);
        }
        console.log('here');
        if (data) {
          const url = supabase.storage
            .from('user-images/public')
            .getPublicUrl(bucketPath);
          const updatedUser = await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              images: [...user.images, url.data.publicUrl],
            },
          });
          return reply
            .code(200)
            .send({ message: 'success', user: updatedUser });
        }
      } catch (error) {
        console.log(error);

        reply.code(500).send({ message: 'Internal Server Error' });
      }
      return reply.code(200).send({ message: 'success' });
    } else {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.log(error);
    reply.code(500).send({ message: 'Internal Server Error' });
  }
};
