const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: { type: String, required: true },
  userEmail: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: Number, required: true },
  isAdmin: { type: Boolean, default: false },
  joinedDate: { type: Date, default: Date.now },
  subscription: {
    plan: { type: String, enum: ["basic", "medium", "pro"] }, // Enum for plan types
    startDate: { type: Date },
    planExpiryDate: { type: Date },
    isSubscribed: { type: Boolean, default: false },
  },
});

module.exports = mongoose.model("User", UserSchema);
