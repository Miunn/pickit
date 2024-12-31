"use server"

import { auth } from '@/actions/auth';
import VerifyTemplate from '@/components/emails/VerifyTemplate';
import * as nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { addDays } from 'date-fns';
import ResetPasswordTemplate from '@/components/emails/ResetPasswordTemplate';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "remcaulier@gmail.com",
    pass: process.env.GOOGLE_MAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: "You must be logged in to fetch user info", user: null };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true
    }
  });

  if (!user) {
    return { error: "User not found", user: null };
  }

  if (user.emailVerified) {
    return { error: "Email already verified", user };
  }

  const token = crypto.randomUUID();
  await prisma.verifyEmailRequest.create({
    data: {
      token: token,
      expires: addDays(new Date(), 7),
      user: {
        connect: {
          id: user.id
        }
      }
    }
  });

  const ReactDOMServer = (await import('react-dom/server')).default;
  const content = ReactDOMServer.renderToString(<VerifyTemplate name={user.name} token={token} />);

  const mail = await transporter.sendMail({
    from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
    to: email,
    subject: "Verify your email",
    text: "Verify your email",
    html: content,
  })

  console.log("Message sent: %s", mail.messageId);
}

export async function sendPasswordResetRequest(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true
    }
  });

  if (!user) {
    return { error: null, user: null };
  }

  const token = crypto.randomUUID();
  await prisma.passwordResetRequest.create({
    data: {
      token: token,
      expires: addDays(new Date(), 7),
      user: {
        connect: {
          id: user.id
        }
      }
    }
  });

  const ReactDOMServer = (await import('react-dom/server')).default;
  const content = ReactDOMServer.renderToString(<ResetPasswordTemplate name={user.name} token={token} />);

  const mail = await transporter.sendMail({
    from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
    to: user.email,
    subject: "Reset your password",
    text: "Reset your password",
    html: content,
  })

  console.log("Message sent: %s", mail.messageId);
}