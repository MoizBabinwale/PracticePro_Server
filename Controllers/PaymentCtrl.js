const Razorpay = require("razorpay");
const Payment = require("../model/paymentModal");
const User = require("../model/auth");

const isTestMode = process.env.NODE_ENV === "test" ? true : false;

const instance = new Razorpay({
  key_id: isTestMode ? process.env.TEST_KEY_ID : process.env.KEY_ID,
  key_secret: isTestMode ? process.env.TEST_KEY_SECRET : process.env.KEY_SECRET,
});

const createOrder = async (req, res, next) => {
  const options = {
    amount: Number(req.body.amount * 100),
    currency: "INR",
  };
  const order = await instance.orders.create(options);

  res.status(200).json({
    success: true,
    order,
  });
};

const paymentVerification = async (req, res) => {
  console.log("req.body ", req.body);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (razorpay_order_id && razorpay_signature && razorpay_payment_id) {
    // Database comes here

    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    res.redirect(`http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`);
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
      user.subscription = {
        plan: subscribeFor,
        startDate: currentDate,
        planExpiryDate: planExpiryDate,
        isSubscribed: true,
      };

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
