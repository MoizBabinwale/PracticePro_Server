const mongoose = require("mongoose");
const Options = require("./options");

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: false,
  },
  questionImage: {
    type: String,
    required: false,
  },
  options: [
    {
      text: {
        type: String,
        required: true,
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
    },
  ],
  optionType: {
    type: String,
    required: true,
    default: "text",
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    // required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    // required: true,
  },
  difficultyLevel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "DifficultyLevel",
  },
});

module.exports = mongoose.model("Question", questionSchema);
