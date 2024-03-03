const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Assuming each topic has a unique name
  },
});

module.exports = mongoose.model("Topic", topicSchema);
