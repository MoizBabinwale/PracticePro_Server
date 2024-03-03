const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TimeLimit = new Schema({
  time: {
    type: Number,
    min: 10,
    max: 60,
    required: true,
  },
});

module.exports = mongoose.model("TimeLimit", TimeLimit);
