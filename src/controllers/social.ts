import { PrismaClient } from '@prisma/client';
import { JWT, Params } from '../types';
import { decode } from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * We create a friend request, update the user's liked array to include the user they just liked, and
 * then update the user's feed to not include the user they just liked
 * @param {Params}  - Params
 */
export const sendFriendRequest = async ({ req, res }: Params) => {
  // fromUser -> toUser
  const { fromUserId, toUserId } = req.body;

  try {
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

    const user = await prisma.user.update({
      where: {
        id: fromUserId,
      },
      data: {
        liked: { push: toUserId },
      },
      include: { feed: true },
    });
    // create the new feed without the seen user
    const newFeed = user.feed.filter((u) => {
      // return the new feed without the seen user
      return u.id !== toUserId;
    });
    // update the user's feed to not include the user they just liked
    await prisma.user.update({
      where: {
        id: fromUserId,
      },
      data: {
        feed: {
          set: newFeed.map((u) => {
            return { id: u.id };
          }),
        },
      },
    });

    res.json(friendRequest);
  } catch (error) {
    console.log(error);
  }
};

export const dislikeUser = async ({ req, res }: Params) => {
  const { token, dislikedUserId } = req.body;

  try {
    const user = await prisma.user.update({
      where: {
        id: token,
      },
      data: {
        disliked: { push: dislikedUserId },
      },
      include: { feed: true },
    });
    // create the new feed without the seen user
    const newFeed = user.feed.filter((u) => {
      // return the new feed without the seen user
      return u.id !== dislikedUserId;
    });
    // update the user's feed to not include the user they just liked
    await prisma.user.update({
      where: {
        id: token,
      },
      data: {
        feed: {
          set: newFeed.map((u) => {
            return { id: u.id };
          }),
        },
      },
    });

    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

export const acceptFriendRequest = async ({ req, res }: Params) => {
  // find the friend request
  const { friendRequestId } = req.body;
  console.log(friendRequestId);
  try {
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
            Chat: {
              create: {
                name: `${fromUser.firstName} and ${toUser.firstName}`,
                participants: {
                  connect: [{ id: fromUser.id }, { id: toUser.id }],
                },
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
  } catch (error) {
    console.log(error);
  }
};

export const declineFriendRequest = async ({ req, res }: Params) => {
  const { friendRequestId } = req.body;
  try {
    const friendRequest = await prisma.friendRequest.delete({
      where: {
        id: friendRequestId,
      },
    });
    res.json(friendRequest);
  } catch (error) {
    console.log(error);
  }
};

export const getFriendRequests = async ({ req, res }: Params) => {
  const { token } = req.params;
  const decodedEmail = decode(token as string) as JWT;
  try {
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
  } catch (error) {
    console.log(error);
  }
};

export const getFriends = async ({ req, res }: Params) => {
  const { token } = req.params;
  try {
    const decodedEmail = decode(token as string) as JWT;
    const user = await prisma.user.findUnique({
      where: {
        email: decodedEmail.email,
      },
      include: {
        friends: true,
        chats: true,
      },
    });
    res.json(user?.friends);
  } catch (error) {
    console.log(error);
  }
};
