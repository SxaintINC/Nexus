const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("dotenv").config();

const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());

app.use(express.json());

const actionCodeSettings = {
  url: "http://localhost:3000/login",
  handleCodeInApp: true,
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

app.post("/send-verification", async (req, res) => {
  console.log("🔥 REQUEST HIT");
  console.log(req.body);
  try {
    const { email } = req.body;

    const link = await admin
      .auth()
      .generateEmailVerificationLink(email, actionCodeSettings);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verify Email",

      html: `<div style="
  font-family: Arial, sans-serif;
  background: #f6f6f6;
  padding: 40px 0;
">

  <div style="
    max-width: 520px;
    margin: auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 40px 30px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <h1 style="
      margin: 0;
      font-size: 24px;
      color: #111;
    ">
      Verify your Email
    </h1>

    <!-- Subtitle -->
    <p style="
      margin-top: 12px;
      font-size: 15px;
      color: #555;
      line-height: 1.6;
    ">
      Click the button below to verify your email for <b>Examly</b> and activate your account.
    </p>

    <!-- Button -->
    <a href="${link}" style="
      display: inline-block;
      margin-top: 25px;
      padding: 14px 28px;
      background: #000;
      color: #fff;
      text-decoration: none;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.3px;
    ">
      Verify Email
    </a>

    <!-- Small note -->
    <p style="
      margin-top: 25px;
      font-size: 12px;
      color: #888;
      line-height: 1.5;
    ">
      If you didn’t create an account, you can safely ignore this email.
    </p>

  </div>

  <!-- Footer -->
  <p style="
    text-align: center;
    font-size: 11px;
    color: #aaa;
    margin-top: 20px;
  ">
    © ${new Date().getFullYear()} Examly. All rights reserved.
  </p>

</div>

`,

      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
    });

    res.send({
      success: true,
    });
  } catch (err) {
    console.log("🔥 FULL ERROR:", err);
    res.status(500).send({
      message: err.message,
      error: err,
    });
  }
});

app.listen(5000, () => {
  console.log("Server running");
});
