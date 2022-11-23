import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import { decode, sign } from 'jsonwebtoken';
import { isUserSignedIn } from '../util/user/helpers';
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const client = new Twilio(accountSid, authToken);
const prisma = new PrismaClient();

const authRouter = express.Router();

const randomVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// TODO: find a better way to do this. It isn't quite random, but works for now.
const verificationCode = randomVerificationCode();

let phoneNumber: string = '';

authRouter.post('/auth/sendsms', async (req, res) => {
  phoneNumber = req.body.phoneNumber;

  if (req.body.phoneNumber) {
    client.messages
      .create({
        body: `Your verification code is ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER || '',
        to: `+1${req.body.phoneNumber}`,
      })
      .then((message) => console.log(message.sid))
      .catch((err) => res.status(500).json({ error: err }));

    res.json({ message: 'SMS sent', code: verificationCode });
  } else {
    res.json({ message: 'error' });
  }
});

/* This is the endpoint that will be hit when the user submits the verification code. If the code is
correct, it will create a new user in the database. */
authRouter.post('/auth/verificationcode', async (req, res) => {
  if (
    req.body.verificationCode &&
    req.body.verificationCode === verificationCode
  ) {
    const user = await prisma.user.create({
      data: {
        phoneNumber: phoneNumber,
        firstName: '',
        lastName: '',
        email: '',
        age: 0,
      },
    });
    res.json({ message: 'user created', user: user });
  } else {
    res.json({ message: 'error' });
  }
});

authRouter.post('/auth/details', async (req, res) => {
  const user = await prisma.user.update({
    where: {
      phoneNumber: phoneNumber,
    },
    data: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      age: req.body.age,
      tempJWT: sign({ email: req.body.email }, process.env.JWT_SECRET || ''),
    },
  });
  res.json({ message: 'user updated', user: user });
});

// sign in
authRouter.post('/auth/signin', async (req, res) => {
  const email = req.body.email;
  const user = await prisma.user.update({
    where: {
      email: req.body.email,
    },
    data: {
      tempJWT: sign({ email: email }, process.env.JWT_SECRET || ''),
    },
  });

  if (user) {
    res.json({ message: 'user signed in', user: user.tempJWT });
  } else {
    res.json({ message: 'error' });
  }
});

// sign out
authRouter.post('/auth/signout', async (req, res) => {
  const user = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });

  if (user && (await isUserSignedIn(user.id))) {
    await prisma.user.update({
      where: {
        email: req.body.email,
      },
      data: {
        tempJWT: '',
      },
    });
  }
});

export default authRouter;
