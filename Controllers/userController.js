const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const User = require("../model/auth");
// const { EMAIL, PASSWORD } = require('../env.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Signup = async (req, res) => {
  const { name, userEmail, password, phone } = req.body;
  if (!userEmail) {
    return res.status(400).json({ error: "No recipient email provided" });
  }
  const existingUser = await User.findOne({ userEmail });
  if (existingUser && existingUser.isVerified) {
    return res.status(404).json({ message: "User Alredy Exist" });
  }
  try {
    const otp = await generateOTP();
    let config = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);
    let mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Practice Pro - Registration ",
        link: "https://practisepro.co.in/",
      },
    });
    let response = {
      body: {
        name: `Dear ${name ? name : "User"}`,
        intro: `          
          
          Thank you for registering with Practice Pro. To complete your registration process, please use the following OTP (One-Time Password):<br />
          
          <center><b>OTP : ${otp}</b></center><br />
          
          This OTP is valid for a single use and will expire shortly. Please enter this OTP in the designated field on the registration page to verify your email address.
          
          If you did not initiate this registration process, please ignore this email.
          
          Thank you,
          Practice-Pro (Practise karo, Pro Bano )
          `,
        outro: "Looking forward to do maore work with you.",
      },
    };
    let mail = mailGenerator.generate(response);
    let message = {
      from: process.env.EMAIL,
      to: userEmail, // set the recipient here
      subject: "OTP Verification for Signup Practice-Pro",
      html: mail,
    };
    await transporter.sendMail(message);
    const hashPassword = await bcrypt.hash(password, 10);
    if (existingUser) {
      await User.findOneAndUpdate({ name, userEmail, phone, password: hashPassword, otp: otp, isAdmin: false });
    } else {
      await User.create({
        name,
        userEmail,
        phone,
        password: hashPassword,
        otp: otp,
        isAdmin: false,
      });
    }
    return res.status(200).json({ message: "Email Sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const generateOTP = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verifyOtp = async (req, res) => {
  const { userEmail, otp } = req.body;
  // Here you would retrieve the user's OTP from the database based on their email or any other identifier
  // For simplicity, let's assume the correct OTP is '123456'
  var originalOtp;
  const user = await User.findOne({ userEmail });
  if (!user) {
    return res.status(404).json({ message: "User Does Not Exist..!" });
  }
  originalOtp = user.otp;
  if (otp === originalOtp) {
    await User.updateOne({ userEmail }, { isVerified: true });
    return res.json({ message: "OTP verified successfully!" });
  } else {
    res.status(400).json({ message: "Invalid OTP. Please try again." });
  }
};

const Login = async (req, res) => {
  const { userEmail, password } = req.body;
  try {
    console.log("userEmail ", userEmail);
    const isUserExist = await User.findOne({ userEmail });
    if (!isUserExist) {
      return res.status(404).json({ message: "User Does Not Exist..!" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, isUserExist.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign({ email: isUserExist.email, id: isUserExist._id }, process.env.JWT_SECRETE, { expiresIn: "1h" });
    console.log("isUserExist ", isUserExist);
    res.status(200).json({ data: isUserExist, token, expiresIn: "1h" });
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong..!" });
  }
};

const GetUsers = async (req, res) => {
  try {
    const AllUsers = await User.find();
    res.status(200).json({ data: AllUsers });
  } catch (error) {
    res.status(404).json({ message: "No User Found....!" });
  }
};
module.exports = {
  Signup,
  Login,
  GetUsers,
  verifyOtp,
};
