"use server"

import * as nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { addDays } from 'date-fns';
import ResetPasswordTemplate from '@/components/emails/ResetPasswordTemplate';
import ShareFolderTemplate from '@/components/emails/ShareFolderTemplate';
import { getCurrentSession } from './authUtils';
import { render } from '@react-email/components';
import VerifyEmail from '../../emails/VerifyEmail';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "remcaulier@gmail.com",
    pass: process.env.GOOGLE_MAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string): Promise<{
  error: string | null,
  user: {
    id: string,
    name: string,
    email: string,
    emailVerified: boolean
  } | null
}> {
  const { user } = await getCurrentSession(); // THIS METHOD USES CACHE SO IF THE USER VERIFIED IT MAY NOT HAVE BEEN UPDATED YET

  if (!user) {
    return { error: "You must be logged in to fetch user info", user: null };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true
    }
  });

  if (!currentUser) {
    return { error: "user-not-found", user: null };
  }

  if (currentUser.emailVerified) {
    return { error: "already-verified", user: currentUser };
  }

  const token = crypto.randomUUID();
  try {
    await prisma.verifyEmailRequest.deleteMany({
      where: { userId: currentUser.id }
    });
  } catch (e) {
    console.error("Error deleting previous verification requests", e);
  }

  await prisma.verifyEmailRequest.create({
    data: {
      token: token,
      expires: addDays(new Date(), 7),
      user: {
        connect: {
          id: currentUser.id
        }
      }
    }
  });

  const emailHtml = await render(<VerifyEmail name={currentUser.name} token={token} />);


  const mail = await transporter.sendMail({
    from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
    to: email,
    subject: "Verify your email",
    html: emailHtml,
  })

  return { error: null, user: currentUser };
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

}

export async function sendShareFolderEmail(data: { email: string, link: string }[], name: string, folderName: string) {
  const ReactDOMServer = (await import('react-dom/server')).default;

  data.forEach(async (d) => {
    const content = ReactDOMServer.renderToString(<ShareFolderTemplate name={name} folderName={folderName} link={d.link} />);

    await transporter.sendMail({
      from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
      to: d.email,
      subject: "You've been shared a folder",
      text: "You've been shared a folder",
      html: content,
    })
  });
}