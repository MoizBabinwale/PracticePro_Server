const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const User = require("../model/auth");
// const { EMAIL, PASSWORD } = require('../env.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const Payment = require("../model/paymentModal");

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
        name: "Practise Pro - Registration ",
        link: "https://practisepro.co.in/",
      },
    });
    let response = {
      body: {
        name: `Dear ${name ? name : "User"}`,
        intro: `          
          
          Thank you for registering with Practise Pro. To complete your registration process, please use the following OTP (One-Time Password):<br />
          
          <center><b>OTP : ${otp}</b></center><br />
          
          This OTP is valid for a single use and will expire shortly. Please enter this OTP in the designated field on the registration page to verify your email address.
          
          If you did not initiate this registration process, please ignore this email.
          
          Thank you,
          Practise-Pro (Practise karo, Pro Bano )
          `,
        outro: "Looking forward to do maore work with you.",
      },
    };
    let mail = mailGenerator.generate(response);
    let message = {
      from: process.env.EMAIL,
      to: userEmail, // set the recipient here
      subject: "OTP Verification for Signup Practise-Pro",
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
        subscriptionHistory: [],
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

const verifyOtp = async (req, res, next) => {
  const { userEmail, otp } = req.body;
  try {
    var originalOtp;
    const user = await User.findOne({ userEmail });
    if (!user) return next(new AppError("Uesr Not Found!", 404));
    originalOtp = user.otp;
    if (Number.parseInt(otp) === Number.parseInt(originalOtp)) {
      user.isVerified = true;
      // user.otp = null;
      await user.save();
      return res.json({ message: "OTP verified successfully!" });
    } else {
      res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    return next(new AppError(`${error.message}`, 404));
  }
};

const Login = async (req, res) => {
  const { userEmail, password } = req.body;
  try {
    const isUserExist = await User.findOne({ userEmail });
    if (!isUserExist) {
      return res.status(404).json({ message: "User Does Not Exist..!" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, isUserExist.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign({ email: isUserExist.email, id: isUserExist._id }, process.env.JWT_SECRETE, { expiresIn: "2h" });
    res.status(200).json({ data: isUserExist, token, expiresIn: "2h" });
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

const getUserByMail = async (req, res, next) => {
  try {
    const { mail } = req.body;
    if (!mail) return next(new AppError("Email Not Provided", 404));
    const user = await User.findOne({ userEmail: mail, isVerified: true });
    if (!user) return next(new AppError("Uesr Not Found!", 404));
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
        name: "Practise Pro - Password Reset",
        link: "https://practisepro.co.in/",
      },
    });
    let response = {
      body: {
        name: `Dear ${user.name ? user.name : "User"}`,
        intro: `
            You have requested to reset your password. Please use the following OTP (One-Time Password) to reset your password:<br />
            <center><b>OTP : ${otp}</b></center><br />
            This OTP is valid for a single use and will expire shortly.
            If you did not request a password reset, please ignore this email.
            Thank you,
            Practise-Pro
          `,
        outro: "If you need further assistance, please contact our support.",
      },
    };
    let generatedmail = mailGenerator.generate(response);
    let message = {
      from: process.env.EMAIL,
      to: user.userEmail,
      subject: "OTP Verification for Password Reset",
      html: generatedmail,
    };
    await transporter.sendMail(message);
    user.otp = otp;
    await user.save();
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log("error.message ", error.message);
    res.status(404).json({ message: error.message });
  }
};

const changePassword = async (req, res, next) => {
  const { userEmail, newPassword } = req.body;
  const user = await User.findOne({ userEmail });
  if (!user) return next(new AppError("Uesr Not Found!", 404));

  try {
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return next(new AppError(`${error.message}`, 404));
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().populate("userDetail");
    return res.status(200).json({ data: payments, message: "Payment fetched successfully" });
  } catch (error) {
    return next(new AppError(`${error.message}`, 404));
  }
};

const getAllUsersData = async (req, res, next) => {
  try {
    const user = await User.find();
    return res.status(200).json({ user, message: "Payment fetched successfully" });
  } catch (error) {
    return next(new AppError(`${error.message}`, 404));
  }
};

module.exports = {
  Signup,
  Login,
  GetUsers,
  verifyOtp,
  getUserByMail,
  changePassword,
  getAllPayments,
  getAllUsersData,
};
