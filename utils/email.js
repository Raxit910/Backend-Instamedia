import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send account activation email
 */
export const sendActivationEmail = async (to, token) => {
  const url = `${process.env.FRONTEND_URL}/activate/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Activate your Instamedia account',
    html: `
      <h2>Welcome to Instamedia!</h2>
      <p>Please click the link below to activate your account:</p>
      <a href="${url}" style="background-color: blue; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; cursor: pointer; display: inline-block;">
        Activate Account
      </a>
      <br/><br/>
      <p>This link will expire in 24 hours.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendResetEmail = async (to, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your Instamedia password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password (valid for 15 minutes):</p>
      <a href="${url}" style="background-color: blue; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; cursor: pointer; display: inline-block;">
        Reset Password
      </a>
    `,
  };

  await transporter.sendMail(mailOptions);
};
