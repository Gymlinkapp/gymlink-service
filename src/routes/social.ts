import express from 'express';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  sendFriendRequest,
} from '../controllers/social';

const socialRouter = express.Router();

socialRouter.post(
  '/social/sendFriendRequest',
  async (req, res) => await sendFriendRequest({ req, res })
);

socialRouter.post(
  '/social/acceptFriendRequest',
  async (req, res) => await acceptFriendRequest({ req, res })
);

// decline friend request
socialRouter.post(
  '/social/declineFriendRequest',
  async (req, res) => await declineFriendRequest({ req, res })
);

// get friend requests for a user
socialRouter.get(
  '/social/getFriendRequests/:token',
  async (req, res) => await getFriendRequests({ req, res })
);

// get friends for a user
socialRouter.get(
  '/social/getFriends/:token',
  async (req, res) => await getFriends({ req, res })
);

export default socialRouter;
