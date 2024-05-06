const axios = require("axios");
const express = require("express");
const User = require("../model/auth");
const stripe = require("stripe")("sk_test_51Mp63RSDzlYEZ1IK6AYZh6T0F1HWy5IYNOfiqvcfNpsVdCzoSC4T5B1xE6XnEd4rfKRQ0Cs26Q9S738vO7mJKYuu00Sce5V1BN");
// Generate Access Token
const getToken = async (req, res) => {
  try {
    const encodedParams = new URLSearchParams();
    encodedParams.set("grant_type", "client_credentials");
    encodedParams.set("client_id", "test_mWmc8uUyMORaI0bEw6mzmo3MCo4fuoZhd8m");
    encodedParams.set("client_secret", "test_tfbYdh9tKb0WOFYhbpeo5cApzaMLxzMhms9PDPyymXxqysWKIm9RBrpWJRBzxoGDMVXWCIRRqADKSO14jZvK6bfUlAVzWf6r7noTBNLiZo3PXVcrBNTyaTIhfZw");

    const options = {
      method: "POST",
      url: "https://test.instamojo.com/oauth2/token/",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      data: encodedParams,
    };

    axios
      .request(options)
      .then(function (response) {
        return res.status(200).send(response.data.access_token);
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {}
};

// Create Payment Request
const createOreder = async (req, res) => {
  const { email, amount, subscribefor } = req.body;
  try {
    const lineItems = [
      {
        price_data: {
          currency: "inr", // Adjust this according to your currency
          unit_amount: amount * 100, // Adjust this according to your product's price
          product_data: {
            name: `${subscribefor}`, // Adjust this according to your product's name
          },
        },
        quantity: 1,
      },
    ];

    const updatedUserData = await updateUserSubscription({ userEmail: email, subscribeFor: subscribefor });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `https://practice-pro-client.vercel.app/success?&status=Success&userData=${encodeURIComponent(JSON.stringify(updatedUserData))}`,
      cancel_url: `https://practice-pro-client.vercel.app/cancel?status=Fail&suerData=${encodeURIComponent(JSON.stringify(updatedUserData))}`,
    });

    console.log("session", session);
    if (session.id) {
      res.json({ id: session.id, updatedUserData });
    }
  } catch (error) {}
};

const checkePaymentStatus = async (req, res) => {
  try {
    const options = {
      method: "GET",
      url: `https://test.instamojo.com/v2/payment_requests/${req.query.payment_request_id}/`,
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${req.query.token}`,
      },
    };

    axios
      .request(options)
      .then(async function (response) {
        if (response.data.status === "Completed") {
          const userEmail = response.data.email;
          const subscribeFor = response.data.buyer_name;

          // Update user's subscription based on the payment details
          const updatedUserData = await updateUserSubscription(userEmail, subscribeFor);
          res.redirect(`http://localhost:3000/success?name=${response.data.buyer_name}&status=${response.data.status}&userData=${encodeURIComponent(JSON.stringify(updatedUserData))}`);
        } else {
          return res.redirect(`http://localhost:3000/failure`);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {}
};

const resetUserData = async (req, res) => {
  const { userEmail } = req.body;
  try {
    const user = await User.findOne({ userEmail });
    if (!user) {
      res.send("User Not Found!");
    }
    user.subscription = {
      plan: "",
      startDate: "",
      planExpiryDate: "",
      isSubscribed: false,
    };

    await user.save();
    res.status(200), json({ message: "User Update Successfully", user });
  } catch (error) {}
};

const updateUserSubscription = async ({ userEmail, subscribeFor }) => {
  try {
    const user = await User.findOne({ userEmail });

    if (user) {
      let planExpiryDate;
      const currentDate = new Date();

      // Clone currentDate to ensure independent objects
      const startDate = new Date(currentDate);

      // Calculate plan expiry date based on subscription type
      if (subscribeFor === "basic") {
        planExpiryDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
      } else if (subscribeFor === "medium") {
        planExpiryDate = new Date(startDate.setMonth(startDate.getMonth() + 6));
      } else if (subscribeFor === "pro") {
        planExpiryDate = new Date(startDate.setMonth(startDate.getMonth() + 12));
      }

      // Update user's subscription details
      user.subscription = {
        plan: subscribeFor,
        startDate: currentDate,
        planExpiryDate: planExpiryDate,
        isSubscribed: true,
      };

      await user.save();
      return user;
    }
  } catch (error) {
    console.error(error);
    throw error; // Propagate error to the caller if any
  }
};

module.exports = {
  checkePaymentStatus,
  createOreder,
  getToken,
  resetUserData,
};
