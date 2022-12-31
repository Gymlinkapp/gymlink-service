import { PrismaClient, User } from '@prisma/client';
import express from 'express';
import { decode } from 'jsonwebtoken';
import { JWT } from 'src/types';

const prisma = new PrismaClient();

const socialRouter = express.Router();

socialRouter.post('/social/sendFriendRequest', async (req, res) => {
  // fromUser -> toUser
  const { fromUserId, toUserId } = req.body;

  const friendRequest = await prisma.friendRequest.create({
    data: {
      fromUser: {
        connect: {
          id: fromUserId,
        },
      },
      toUser: {
        connect: {
          id: toUserId,
        },
      },
    },
  });

  res.json(friendRequest);
});

socialRouter.post('/social/acceptFriendRequest', async (req, res) => {
  // find the friend request
  const { friendRequestId } = req.body;
  const friendRequest = await prisma.friendRequest.findUnique({
    where: {
      id: friendRequestId,
    },
  });
  if (friendRequest) {
    // get users from friend request:
    const fromUser = await prisma.user.findFirst({
      where: {
        id: friendRequest.fromUserId,
      },
    });
    const toUser = await prisma.user.findFirst({
      where: {
        id: friendRequest.toUserId,
      },
    });

    if (fromUser && toUser) {
      // create the friendship by updating user with new friend
      await prisma.user.update({
        where: {
          id: fromUser.id,
        },
        data: {
          friends: {
            connect: {
              id: toUser.id,
            },
          },
        },
      });

      await prisma.user.update({
        where: {
          id: toUser.id,
        },
        data: {
          friends: {
            connect: {
              id: fromUser.id,
            },
          },
        },
      });
      // delete the friend request
      await prisma.friendRequest.delete({
        where: {
          id: friendRequestId,
        },
      });

      // get friends of the user
      const friends = await prisma.user.findUnique({
        where: {
          id: fromUser.id,
        },
        include: {
          friends: true,
        },
      });
      res.json(friends);
    }
  }
});

// decline friend request
socialRouter.post('/social/declineFriendRequest', async (req, res) => {
  const { friendRequestId } = req.body;
  const friendRequest = await prisma.friendRequest.delete({
    where: {
      id: friendRequestId,
    },
  });
  res.json(friendRequest);
});

// get friend requests for a user
socialRouter.get('/social/getFriendRequests/:token', async (req, res) => {
  const { token } = req.params;
  const decodedEmail = decode(token) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decodedEmail.email,
    },
  });
  const userId = user?.id;
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      toUserId: userId,
    },
    include: {
      fromUser: true,
    },
  });
  res.json(friendRequests);
});

// get friends for a user
socialRouter.get('/social/getFriends/:token', async (req, res) => {
  const { token } = req.params;
  const decodedEmail = decode(token) as JWT;
  const user = await prisma.user.findUnique({
    where: {
      email: decodedEmail.email,
    },
    include: {
      friends: true,
    },
  });
  res.json(user?.friends);
});

export default socialRouter;
