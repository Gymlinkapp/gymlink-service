import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { isUserSignedIn } from '../util/user/helpers';
import { JWT } from '../types';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const client = new Twilio(accountSid, authToken);
const prisma = new PrismaClient();

const authRouter = express.Router();

const randomVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

authRouter.post('/auth/sendsms', async (req, res) => {
  const generatedVerificationCode = randomVerificationCode();
  if (req.body.phoneNumber) {

    // send sms
    try {
      await client.messages.create({
        body: `Gymlink - Your verification code is ${generatedVerificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER || '',
        to: `+${req.body.phoneNumber}`,
      });
    } catch (error) {
      res.status(500).json({ error });
    }

    // create user with base phonenumber
    // phonenumbers are unique and can be used to identify users
    try {
      // check if the user exists with the given phonenumber
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: req.body.phoneNumber,
        },
      });

      // if there isn't already a user:
      if (!user) {
        const user = await prisma.user.create({
          data: {
            phoneNumber: req.body.phoneNumber,
            verificationCode: generatedVerificationCode,
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            age: 0,

            // update the step of the auth process
            authSteps: 1,
          },
        });
        res.json({
          message: 'SMS sent',
          authStep: user.authSteps,
          code: user.verificationCode,
          phoneNumber: user.phoneNumber,
        });
      }

      // if there is already a user:
      if (user) {
        const existingUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            verificationCode: generatedVerificationCode,
          },
        });
        res.status(200).json({
          message: 'Verification code sent',
          code: existingUser.verificationCode,
          phoneNumber: existingUser.phoneNumber,
        });
      }
    } catch (error) {
      console.log(error);
    }
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
      // if it is a new user and doesn't have the basic info:
      if (!user.verified && !user.firstName && !user.lastName) {
        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            authSteps: 2,
            verified: true,
          },
        });
        res.json({
          message: 'user created',
          authStep: updatedUser.authSteps,
          user: updatedUser,
          verified: true,
        });
      }

      // if the user is verified already, there are most likely trying to log in.
      if (user.verified && user.firstName && user.lastName) {
        // if the user is verified, and has a first and last name, then they are good to go.
        const token = sign(
          { email: user.email },
          process.env.JWT_SECRET || '',
          {
            expiresIn: '1d',
          }
        );
        const signedInUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            tempJWT: token,
          },
        });
        res.json({ message: 'success', token: signedInUser.tempJWT });
      }
    } else {
      // code doesn't match and or is incorreclty inputted
      console.log('wrong');
      res.status(400).json({ message: 'incorrect code' });
    }
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
      if (user.firstName && user.lastName && user.email && user.password) {
        res.json({ message: 'User has already filled out details' });
      } else {
        const userWithDetails = await prisma.user.update({
          where: {
            phoneNumber: req.body.phoneNumber,
          },
          data: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email.toLowerCase(),
            // password: bcrypt.hashSync(req.body.password, 10),
            age: req.body.age,
            authSteps: 3,
            bio: req.body.bio,
            tempJWT: sign(
              { email: req.body.email },
              process.env.JWT_SECRET || ''
            ),
          },
        });

        res.json({
          message: 'user updated',
          authStep: userWithDetails.authSteps,
          user: userWithDetails,
          token: userWithDetails.tempJWT,
        });
      }
    }
  } catch (error) {
    res.json({ message: 'error', error: error });
  }
});

// sign in
authRouter.post('/auth/signin', async (req, res) => {
  const email = req.body.email;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      const token = sign({ email }, process.env.JWT_SECRET || '');
      const userWithToken = await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          tempJWT: token,
        },
      });
      res.json({ message: 'user signed in', token: userWithToken.tempJWT });
    } else {
      res.status(401).json({ message: 'invalid credentials' });
    }
  } catch (error) {
    res.json({ message: 'error', error: error });
  }
});

// sign out
authRouter.post('/auth/signout', async (req, res) => {
  let { token } = req.body;
  // console.log(verify(token, process.env.JWT_SECRET || ''));
  try {
    token = verify(token, process.env.JWT_SECRET || '') as JWT;
    const user = await prisma.user.findFirst({
      where: {
        email: token.email,
      },
    });
    if (user) {
      const userWithToken = await prisma.user.update({
        where: {
          email: token.email,
        },
        data: {
          tempJWT: null,
        },
      });
      res.json({ message: 'user signed out', token: userWithToken.tempJWT });
    }
  } catch (error) {
    res.json({ message: 'error', error: error });
  }
});

export default authRouter;
