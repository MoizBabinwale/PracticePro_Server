const Razorpay = require("razorpay");
const Payment = require("../model/paymentModal");
const User = require("../model/auth");

const isTestMode = process.env.NODE_ENV === "test" ? true : false;

const instance = new Razorpay({
  key_id: isTestMode ? process.env.TEST_KEY_ID : process.env.KEY_ID,
  key_secret: isTestMode ? process.env.TEST_KEY_SECRET : process.env.KEY_SECRET,
});

const createOrder = async (req, res, next) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100),
      currency: "INR",
      receipt: req.body?.userName,
    };
    const order = await instance.orders.create(options);

    await Payment.create({
      razorpay_order_id: order?.id,
      userDetail: req.body?.userId,
      amount: req.body.amount,
      status: "Payment Pending",
    });

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const paymentVerification = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (razorpay_order_id && razorpay_signature && razorpay_payment_id) {
    // Database comes here
    const payment = await Payment.findOne({ razorpay_order_id });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.status = "Paid";
    payment.save();

    return res.json({ redirectUrl: `https://practisepro.co.in/paymentsuccess?reference=${razorpay_payment_id}` });

    // return res.json({ redirectUrl: `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}` });
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

const updateUserSubscription = async (req, res) => {
  try {
    const { id, subscribeFor } = req.body;
    const user = await User.findById(id);
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
      // Create a new subscription object
      const newSubscription = {
        plan: subscribeFor,
        startDate: currentDate,
        planExpiryDate: planExpiryDate,
        isSubscribed: true,
      };

      // Add the new subscription to the user's subscription history array
      if (!user.subscriptionHistory) {
        user.subscriptionHistory = [];
      }
      user.subscriptionHistory.push(newSubscription);

      // Update the user's current subscription details
      user.subscription = newSubscription;

      await user.save();
      res.status(200).json({
        success: true,
        user,
      });
    }
  } catch (error) {
    console.error(error);
    throw error; // Propagate error to the caller if any
  }
};

module.exports = {
  paymentVerification,
  createOrder,
  updateUserSubscription,
};
