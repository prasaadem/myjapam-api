// s3Uploader.js

const aws = require("aws-sdk");
const nodemailer = require("nodemailer");
import dotenv from "dotenv";

dotenv.config();

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const transporter = nodemailer.createTransport({
  SES: new aws.SES({ apiVersion: "2010-12-01" }),
});

const sendEmail = (toEmail: string[], subject: string, body: string) => {
  return transporter.sendMail({
    from: "aditya@myjapam.com",
    to: toEmail,
    subject: subject,
    text: body,
  });
};

const adminEmailNotify = (subject: string, body: string) => {
  const adminEmails = ["aditya@myjapam.com", "praveen@myjapam.com"];
  return sendEmail(adminEmails, subject, body);
};

export default {
  sendEmail,
  adminEmailNotify,
};
