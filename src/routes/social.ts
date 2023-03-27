import express from 'express';

const socialRouter = express.Router();

// a user will be able to create a `link` with a user (which is just a chat)
socialRouter.post('/link', (req, res) => {});

export default socialRouter;
