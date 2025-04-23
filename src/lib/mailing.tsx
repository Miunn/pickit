import * as nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.MAIL_SENDER,
    pass: process.env.MAIL_PASSWORD,
  },
  dkim: {
    domainName: "echomori.fr",
    keySelector: "default",
    privateKey: process.env.MAIL_DKIM_PRIVATE_KEY
  }
} as nodemailer.TransportOptions);