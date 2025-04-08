import * as nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: process.env.NODE_ENV === "production" ? 465 : 587,
  secure: process.env.NODE_ENV === "production" ? true : false, // true for port 465, false for other ports
  auth: {
    user: "remcaulier@gmail.com",
    pass: process.env.GOOGLE_MAIL_PASSWORD,
  },
});