const Razorpay = require("razorpay");

const isTestMode = process.env.NODE_ENV === "test" ? true : false;

const instance = new Razorpay({
  key_id: isTestMode ? process.env.TEST_KEY_ID : process.env.KEY_ID,
  key_secret: isTestMode ? process.env.TEST_KEY_SECRET : process.env.KEY_SECRET,
});

exports.createOrder = (req, res) => {
  console.log("res 123 ", req.body);
  const { orderProds } = req.body;
  let totalAmt;
  orderProds.forEach((prod) => {
    totalAmt = prod.amount * prod.qty * 100;
  });

  var options = {
    amount: totalAmt, // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11",
  };
  instance.orders.create(options, function (err, order) {
    console.log("oresder", order);
    res.status(200).json({ order });
  });
};

exports.paymentVerification = (req, res) => {
  console.log("res ", req.body);
  res.redirect("http://localhost:3000/E-comm/Success");
  
  // success_url: `https://practice-pro-client.vercel.app/success?&status=Success&userData=${encodeURIComponent(JSON.stringify(updatedUserData))}`,
  // cancel_url: `https://practice-pro-client.vercel.app/cancel?status=Fail&suerData=${encodeURIComponent(JSON.stringify(updatedUserData))}`,
  // res.status(200).json({
  // success:true
  // });
};
