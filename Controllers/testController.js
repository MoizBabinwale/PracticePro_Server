const Subject = require("../model/subjects");
const Question = require("../model/questions");
const Test = require("../model/tests");
const TimeLimit = require("../model/timeLimit");
const DifficultyLevel = require("../model/difficultyLevel");
const Result = require("../model/result");

// Controller functions for subjects
const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const subject = await Subject.create({ name, description });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller functions for questions
const createQuestion = async (req, res) => {
  try {
    const { text, options, subjectId, testId, difficultyLevel } = req.body;

    // Handle the case where _id is not present
    const topicExists = await Subject.exists({ _id: subjectId });

    if (!topicExists) {
      throw new Error("Topic not found");
    }
    const question = new Question({
      text,
      options,
      subjectId,
      testId,
      difficultyLevel,
    });

    // Save the question to the database
    await question.save();
    await Test.findByIdAndUpdate(testId, { $push: { questionIds: question._id } });
    res.status(201).json({ question });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getquestionswithLimit = async (req, res) => {
  try {
    const { testId, topicId, difficultyId, questionLimit } = req.body;

    let questions = await Question.find({
      testId: testId,
      subjectId: topicId,
      difficultyLevel: difficultyId,
    });
    questions = await shuffleArray(questions);

    // Limit the array to the specified questionLimit
    questions = questions.slice(0, questionLimit);

    res.status(201).json({ questions });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const updateQuestions = async (req, res) => {
  const updatedQuestions = [];
  const { questionsData } = req.body;
  try {
    for (const update of questionsData) {
      const { _id, text, options, subjectId, testId, difficultyLevel } = update;

      if (_id) {
        const updatedQuestion = await Question.findByIdAndUpdate(
          _id,
          {
            text,
            options,
            subjectId,
            testId,
            difficultyLevel,
          },
          { new: true }
        ); // Set new: true to return the updated document
        updatedQuestions.push(updatedQuestion);
      }
    }
    res.status(200).json({ message: "Question Updated Successfully!" });
  } catch (error) {
    console.log("error ", error);
  }
};

// Controller functions for tests
const createTest = async (req, res) => {
  try {
    const { testName, subjectId, questionIds } = req.body;
    const test = await Test.create({ testName, subjectIds: subjectId, questionIds });
    res.status(201).json({ message: "Test Created Successfully", test });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const appendToTest = async (req, res) => {
  try {
    const { testId, subjectId, questionIds } = req.body;

    // Find the test by its ID
    const test = await Test.findById(testId);

    // If the test is not found, return an error
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    // Function to check if an ID already exists in the array
    const isAlreadyPresent = (id, array) => array.some((itemId) => itemId.equals(id));

    // Append subjectId and questionIds to the test if they are not already present
    if (subjectId && !isAlreadyPresent(subjectId, test.subjectIds)) {
      test.subjectIds.push(subjectId);
    }
    if (questionIds && questionIds.length > 0) {
      questionIds.forEach((questionId) => {
        if (!isAlreadyPresent(questionId, test.questionIds)) {
          test.questionIds.push(questionId);
        }
      });
    }

    // Save the updated test
    await test.save();

    // Send response with the updated test
    res.json({ message: "Test updated successfully", test });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSubjectsForTest = async (req, res) => {
  try {
    const { testId } = req.params;
    // Find the test by ID
    const test = await Test.findById(testId).populate("subjectIds");
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    res.status(200).json(test.subjectIds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllSubjects = async (req, res) => {
  try {
    // Find All Subjects
    const allSub = await Subject.find();
    res.status(200).json({ message: "subject fetched Succeffully", data: allSub ? allSub : [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTimeLimit = async (req, res) => {
  try {
    const { time } = req.body;
    const response = await TimeLimit.create({
      time,
    });
    res.status(201).json({ message: "Time Limit Created Successfully", response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createDifficulty = async (req, res) => {
  try {
    const { level } = req.body;
    const response = await DifficultyLevel.create({
      level,
    });
    res.status(201).json({ message: "Difficulty Level Created Successfully", response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTimeLimits = async (req, res) => {
  try {
    const allTimeLimit = await TimeLimit.find();
    res.status(201).json({ message: "Limit Fetched Successfully", allTimeLimit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDifficulty = async (req, res) => {
  try {
    const difficultyLevels = await DifficultyLevel.find();
    res.status(201).json({ message: "Difficulty Level Fetched Successfully", difficultyLevels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllTest = async (req, res) => {
  try {
    const allTests = await Test.find();
    res.status(201).json({ message: "Test Name Fetched Successfully", allTests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getQuestionsBySubjectAndTestId = async (req, res) => {
  try {
    const { subjectId, testId } = req.body;
    const questions = await Question.find({
      subjectId: subjectId,
      testId: testId,
    });

    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkAnswer = async (req, res) => {
  const userId = req.userId;
  try {
    const { questions } = req.body;

    // Calculate score by comparing selected options with correct answers
    let score = 0;
    const questionData = questions.questions;
    for (const question of questionData) {
      const correctOption = question.options.find((option) => option.isCorrect);
      if (correctOption && correctOption._id === question.selectedOption) {
        score++;
      }
    }

    // Save the result in the results schema
    const result = new Result({
      userId: userId,
      score: score,
      totalQuestions: questionData.length,
      date: new Date(),
    });
    await result.save();

    // Send the result as response
    res.status(200).json({ score: score, totalQuestions: questions.length });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllResult = async (req, res) => {
  try {
    const userId = req.userId;
    const results = await Result.find({ userId: userId });
    res.status(200).json({ message: "Result Fetched", results });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllSubjects,
  createSubject,
  createQuestion,
  createTest,
  getSubjectsForTest,
  createTimeLimit,
  createDifficulty,
  getTimeLimits,
  getDifficulty,
  getAllTest,
  appendToTest,
  getQuestionsBySubjectAndTestId,
  updateQuestions,
  getquestionswithLimit,
  checkAnswer,
  getAllResult,
};
