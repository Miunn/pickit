"use server"

import { auth } from '@/actions/auth';
import VerifyTemplate from '@/components/emails/VerifyTemplate';
import * as nodemailer from 'nodemailer';
import { prisma } from './prisma';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "remcaulier@gmail.com",
    pass: process.env.GOOGLE_MAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string[]) {
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

  const ReactDOMServer = (await import('react-dom/server')).default;
  const content = ReactDOMServer.renderToString(<VerifyTemplate name={user.name} token='token' />);

  const mail = await transporter.sendMail({
    from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
    to: email.join(', '),
    subject: "Verify your email",
    text: "Verify your email",
    html: content,
  })

  console.log("Message sent: %s", mail.messageId);
}