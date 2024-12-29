import * as nodemailer from 'nodemailer';

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
    
    const info = await transporter.sendMail({
        from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
        to: email.join(', '),
        subject: "Hello ✔",
        text: "Hello world?",
        html: "<b>Hello world?</b>",
    })

    console.log("Message sent: %s", info.messageId);
}