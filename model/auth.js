const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: { type: String, required: true },
  userEmail: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: Number, required: true },
  isAdmin: { type: Boolean, default: false },
  joinedDate: { type: Date, default: Date.now },
  otp: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  subscription: {
    plan: { type: String, enum: ["basic", "medium", "pro"] }, // Enum for plan types
    startDate: { type: Date },
    planExpiryDate: { type: Date },
    isSubscribed: { type: Boolean, default: false },
  },
  subscriptionHistory: Array,
});

// Define a pre-save hook to update isSubscribed based on planExpiryDate
UserSchema.pre("save", function (next) {
  const currentDate = new Date();
  if (this.subscription.planExpiryDate && this.subscription.planExpiryDate < currentDate) {
    // If plan expiry date has passed, set isSubscribed to false
    this.subscription.isSubscribed = false;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
