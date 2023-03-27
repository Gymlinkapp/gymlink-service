import express from 'express';
import { LinkWithUser } from '../controllers/social';

const socialRouter = express.Router();

// a user will be able to create a `link` with a user (which is just a chat)
socialRouter.post('/social/link', (req, res) => LinkWithUser({ req, res }));

export default socialRouter;
