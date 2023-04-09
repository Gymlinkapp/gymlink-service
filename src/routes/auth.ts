import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT } from '../types';
import { FastifyPluginAsync } from 'fastify';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const client = new Twilio(accountSid, authToken);
const prisma = new PrismaClient();

const randomVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const authRoutes: FastifyPluginAsync = async (fastify, _) => {
  fastify.post('/auth/sendsms', async (request, reply) => {
    const generatedVerificationCode = randomVerificationCode();
    type requestbdy = {
      phoneNumber: string;
    };
    const { phoneNumber } = request.body as requestbdy;
    if (phoneNumber) {
      // send sms
      try {
        await client.messages.create({
          body: `Gymlink - Your verification code is ${generatedVerificationCode}`,
          from: process.env.TWILIO_PHONE_NUMBER || '',
          to: `+${phoneNumber}`,
        });
      } catch (error) {
        reply.code(500).send({ error });
      }

      // create user with base phonenumber
      // phonenumbers are unique and can be used to identify users
      try {
        // check if the user exists with the given phonenumber
        const user = await prisma.user.findFirst({
          where: {
            phoneNumber: phoneNumber,
          },
        });

        // if there isn't already a user:
        if (!user) {
          const user = await prisma.user.create({
            data: {
              phoneNumber: phoneNumber,
              verificationCode: generatedVerificationCode,
              firstName: '',
              lastName: '',
              gender: '',
              race: '',
              email: '',
              password: '',
              age: 0,

              // update the step of the auth process
              authSteps: 1,
            },
          });
          reply.send({
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
          reply.code(200).send({
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

  fastify.post('/auth/verificationcode', async (request, reply) => {
    // simply a new input will display for the code (under the phone number input).
    type requestbdy = {
      verificationCode: string;
      phoneNumber: string;
    };
    const { verificationCode, phoneNumber } = request.body as requestbdy;
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
          reply.send({
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
          reply.send({ message: 'success', token: signedInUser.tempJWT });
        }
      } else {
        // code doesn't match and or is incorreclty inputted
        console.log('wrong');
        reply.code(400).send({ message: 'incorrect code' });
      }
    } catch (error) {
      reply.send({ message: 'error', error: error });
    }
  });

  fastify.post('/auth/details', async (request, reply) => {
    type requestbdy = {
      phoneNumber: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      age: number;
      race: string;
      gender: string;
      bio: string;
    };
    const {
      phoneNumber,
      firstName,
      lastName,
      email,
      password,
      bio,
      age,
      race,
      gender,
    } = request.body as requestbdy;
    try {
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: phoneNumber,
        },
      });
      console.log(user);
      if (user && user.verified) {
        const userWithDetails = await prisma.user.update({
          where: {
            phoneNumber: phoneNumber,
          },
          data: {
            firstName: firstName,
            lastName: lastName,
            email: email.toLowerCase(),
            // password: bcrypt.hashSync(password, 10),
            age: age,
            gender: gender,
            race: race,
            authSteps: 3,
            bio: bio,
            tempJWT: sign({ email: email }, process.env.JWT_SECRET || ''),
          },
        });
        console.log(userWithDetails);
        reply.send({
          message: 'user updated',
          authStep: userWithDetails.authSteps,
          user: userWithDetails,
          token: userWithDetails.tempJWT,
        });
      }
    } catch (error) {
      reply.send({ message: 'error', error: error });
    }
  });

  fastify.post('/auth/signin', async (request, reply) => {
    type requestbdy = {
      email: string;
      password: string;
    };
    const { email, password } = request.body as requestbdy;
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: email,
        },
      });

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = sign({ email }, process.env.JWT_SECRET || '');
        const userWithToken = await prisma.user.update({
          where: {
            email: email,
          },
          data: {
            tempJWT: token,
          },
        });
        reply.send({ message: 'user signed in', token: userWithToken.tempJWT });
      } else {
        reply.code(401).send({ message: 'invalid credentials' });
      }
    } catch (error) {
      reply.send({ message: 'error', error: error });
    }
  });

  fastify.post('/auth/signout', async (request, reply) => {
    type requestBdy = {
      token: any;
    };
    let { token } = request.body as requestBdy;
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
        reply.send({
          message: 'user signed out',
          token: userWithToken.tempJWT,
        });
      }
    } catch (error) {
      reply.send({ message: 'error', error: error });
    }
  });
};

export default authRoutes;
