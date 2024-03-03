const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const User = require("../model/auth");
// const { EMAIL, PASSWORD } = require('../env.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Signup = async (req, res) => {
  const { name, userEmail, password, phone } = req.body;
  console.log(name, userEmail, phone);
  if (!userEmail) {
    return res.status(400).json({ error: "No recipient email provided" });
  }
  const existingUser = await User.findOne({ userEmail });
  if (existingUser) {
    return res.status(404).json({ message: "User Alredy Exist" });
  }
  try {
    // let config = {
    //     service: 'gmail',
    //     auth: {
    //         user: EMAIL,
    //         pass: PASSWORD
    //     }

    // }
    // let transporter = nodemailer.createTransport(config)
    // let mailGenerator = new Mailgen({
    //     theme: 'default',
    //     product: {
    //         name: 'Mailgen',
    //         link: 'https://mailgen.js/'
    //     }
    // })
    // let response = {
    //     body: {
    //         name: 'Product Company',
    //         intro: "Your Bill has arrived",
    //         table: {
    //             data: [
    //                 {
    //                     item: 'Nodemailer Stack Book',
    //                     discription: "Nothing",
    //                     Prize: '1000Rs'
    //                 }
    //             ]
    //         },
    //         outro: "Looking forward to do maore work with you."
    //     }
    // }
    // let mail = mailGenerator.generate(response)
    // let message = {
    //     from: EMAIL,
    //     to: userEmail, // set the recipient here
    //     subject: 'Place Order',
    //     html: mail
    // }
    // await transporter.sendMail(message)
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      userEmail,
      phone,
      password: hashPassword,
      isAdmin: false,
    });
    return res.status(200).json({ message: "User created successfully", result: newUser });
  } catch (error) {
    res.status(500).json({ message: error });
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
    const token = jwt.sign({ email: isUserExist.email, id: isUserExist._id }, process.env.JWT_SECRETE, { expiresIn: "1h" });
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
};
