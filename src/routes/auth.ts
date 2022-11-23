import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import { sign } from 'jsonwebtoken';
import { isUserSignedIn } from '../util/user/helpers';
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const client = new Twilio(accountSid, authToken);
const prisma = new PrismaClient();

const authRouter = express.Router();

/* 
* the prefered flow on most apps is to sign up via phone number.

1. user enters phone number
  - which will create a user
  - send a verification code to the phone number
2. user receives a verification code via sms
3. user enters verification code
  - which will verify the user
4. redirect to fill out profile
  - which will update that user

*/

const randomVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

authRouter.post('/auth/sendsms', async (req, res) => {
  const generatedVerificationCode = randomVerificationCode();
  if (req.body.phoneNumber) {
    // send sms
    try {
      await client.messages.create({
        body: `Your verification code is ${generatedVerificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER || '',
        to: `+1${req.body.phoneNumber}`,
      });
    } catch (error) {
      res.status(500).json({ error });
    }

    // create user with base phonenumber
    try {
      const user = await prisma.user.create({
        data: {
          phoneNumber: req.body.phoneNumber,
          verificationCode: generatedVerificationCode,
          firstName: '',
          lastName: '',
          email: '',
          age: 0,
        },
      });
      res.json({ message: 'SMS sent', code: user.verificationCode });
    } catch (error) {
      res.status(500).json({ error: error });
    }
  } else {
    res.status(400).json({ error: 'missing phone number' });
  }
});

/* This is the endpoint that will be hit when the user submits the verification code. If the code is
correct, it will create a new user in the database. */
authRouter.post('/auth/verificationcode', async (req, res) => {
  // simply a new input will display for the code (under the phone number input).
  const { verificationCode, phoneNumber } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
      },
    });
    if (user && user.verificationCode === verificationCode) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          verified: true,
        },
      });
    }
    res.json({ message: 'user created', user: user?.phoneNumber });
  } catch (error) {
    res.json({ message: 'error', error: error });
  }
});

authRouter.post('/auth/details', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: req.body.phoneNumber,
      },
    });
    if (user && user.verified) {
      const userWithDetails = await prisma.user.update({
        where: {
          phoneNumber: req.body.phoneNumber,
        },
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          age: req.body.age,
          tempJWT: sign(
            { email: req.body.email },
            process.env.JWT_SECRET || ''
          ),
        },
      });

      res.json({ message: 'user updated', user: userWithDetails });
    }
  } catch (error) {
    res.json({ message: 'error', error: error });
  }
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
