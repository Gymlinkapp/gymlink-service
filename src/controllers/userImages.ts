import { PrismaClient } from '@prisma/client';
import { decode } from 'jsonwebtoken';
import { JWT, Params } from 'src/types';
import { supabase } from '..';

const prisma = new PrismaClient();

export const uploadUserImage = async ({ req, res }: Params) => {
  const { token, image } = req.body;

  const decoded = decode(token) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });

  if (user && user.images.length > 5) {
    res.status(400).json({ message: 'You can only have 5 images' });
  }

  // create a buffer from the base64 encoded image.
  const buffer = Buffer.from(image, 'base64');
  if (user) {
    const bucketPath = `user-${user.id}-${Math.random()}`;
    try {
      const { data, error } = await supabase.storage
        .from('user-images/public')
        .upload(bucketPath, buffer);
      if (error) {
        console.log(error);
      }
      if (data) {
        const url = supabase.storage
          .from('user-images/public')
          .getPublicUrl(bucketPath);
        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            authSteps: 4,
            images: [...user.images, url.data.publicUrl],
          },
        });
        return res.status(200).json({ message: 'success', user: updatedUser });
      }
    } catch (error) {
      console.log(error);

      res.status(500).json({ message: 'Internal Server Error' });
    }
    return res.status(200).json({ message: 'success' });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
