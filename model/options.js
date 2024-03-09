const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  isText: {
    type: Boolean,
    required: true,
    default: true, // Default to text option
  },
  value: {
    type: String,
    required: function () {
      return this.isText;
    }, // Required if option is text
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false,
  },
});
module.exports = mongoose.model("Options", optionSchema);
