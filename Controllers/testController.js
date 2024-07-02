const Subject = require("../model/subjects");
const Question = require("../model/questions");
const Test = require("../model/tests");
const TimeLimit = require("../model/timeLimit");
const DifficultyLevel = require("../model/difficultyLevel");
const Result = require("../model/result");
const { ObjectId } = require("mongoose");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

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
const createQuestion = async (req, res, next) => {
  try {
    const { text, options, subjectId, testId, difficultyLevel } = req.body;
    // Handle the case where _id is not present
    if (!mongoose.isValidObjectId(subjectId)) return next(new AppError("Not Valid Subject ID", 404));
    const topicExists = await Subject.findById(subjectId);

    if (!topicExists) {
      throw new Error("Topic not found");
    }
    const question = new Question({
      text,
      options,
      subjectId,
      // testId,
      difficultyLevel,
      optionType: "text",
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
const getDemoQuestion = async (req, res) => {
  try {
    // Query the database to find five demo questions
    const demoQuestions = await Question.find().limit(5);

    // Send the demo questions in the response
    res.json({ demoQuestions });
  } catch (error) {
    console.error("Error fetching demo questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getquestionswithLimit = async (req, res) => {
  try {
    const { topicId, difficultyId, questionLimit } = req.body;
    let questions;
    if (difficultyId === "65ed48e24aaf79bee6603f43") {
      questions = await Question.find({
        // testId: testId,
        subjectId: topicId,
      });
    } else {
      questions = await Question.find({
        // testId: testId,
        subjectId: topicId,
        difficultyLevel: difficultyId,
      });
    }
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

const deleteTimeLimit = async (req, res) => {
  try {
    const { id } = req.params;
    await TimeLimit.findOneAndDelete({ _id: id }).exec();
    res.status(201).json({ message: "Time Limit Deleated Successfully" });
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
    const allTests = await Test.find().populate("subjectIds").exec();
    // Now, allTests will contain subjects populated within subjectIds array.

    res.status(201).json({ message: "Test Name Fetched Successfully", Tests: allTests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSubjectFromTest = async (req, res) => {
  const { testId, subjectId } = req.params;

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const subjectIndex = test.subjectIds.findIndex((subject) => subject.id === subjectId);
    if (subjectIndex === -1) {
      return res.status(404).json({ message: "Subject not found in test" });
    }

    test.subjectIds.splice(subjectIndex, 1);
    await test.save();

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getQuestionsBySubjectAndTestId = async (req, res) => {
  try {
    const { subjectId, testId } = req.body;

    // Find the test by testId and ensure it contains the specified subjectId
    const test = await Test.findOne({
      _id: testId,
      subjectIds: subjectId,
    }).populate("questionIds");

    if (!test) {
      return res.status(404).json({ message: "Test not found or does not include the specified subject." });
    }

    // Extract the populated questions
    const questions = test.questionIds;

    // Send the questions as the response
    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkAnswer = async (req, res) => {
  const userId = req.userId;
  try {
    const { questions } = req.body;

    if (!userId) return next(new AppError("Provide UserID", 404));
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
      subjectId: questionData[0].subjectId,
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
    const results = await Result.find({ userId: userId }).sort({ date: -1 }).populate("subjectId");
    res.status(200).json({ message: "Result Fetched", results });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createQuestionwithImageAswellOption = async (req, res) => {
  // Example:
  try {
    const { text, options, subjectId, testId, difficultyLevel } = req.body;

    const jsonOption = JSON.parse(options);
    let QuestionImage;
    for (let fileIndex = 0; fileIndex < req.files.length; fileIndex++) {
      const path = req.files[fileIndex].path;
      if (req.files[fileIndex].originalname.split(".")[0] === "questionImage") {
        QuestionImage = path;
      } else {
        jsonOption[fileIndex - 1].text = path;
      }
    }

    const question = new Question({
      text: JSON.parse(text),
      options: jsonOption,
      questionImage: QuestionImage ? QuestionImage : null,
      subjectId: JSON.parse(subjectId),
      // testId: JSON.parse(testId),
      difficultyLevel: JSON.parse(difficultyLevel),
      optionType: "image",
    });

    const savedQuestion = question.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createQuestionImage = async (req, res) => {
  // Example:
  try {
    const { options, subjectId, testId, difficultyLevel } = req.body;
    const path = req.file.path;

    const question = new Question({
      text: path,
      options: JSON.parse(options),
      subjectId: subjectId,
      // testId: testId,
      difficultyLevel: difficultyLevel,
      optionType: "text",
    });

    const savedQuestion = question.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteQeustions = async (req, res) => {
  const { _id } = req.body; // Assuming _id is sent in the request body

  try {
    // Check if _id is provided
    if (!_id) {
      return res.status(400).json({ error: "Please provide _id" });
    }

    // Find the question by _id and delete it
    const deletedQuestion = await Question.findByIdAndDelete(_id);
    if (!deletedQuestion) {
      return res.status(404).json({ error: "Question not found" });
    }

    // If the question is deleted successfully, send a success response
    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    // If an error occurs, send an error response
    console.error("Error deleting question:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteTest = async (req, res, next) => {
  const { id } = req.params; // Assuming _id is sent in the request body

  try {
    // Check if _id is provided
    if (!id) return next(new AppError("Id Not Provided", 500));

    // Find the question by _id and delete it
    const deleteTest = await Test.findByIdAndDelete(id);
    if (!deleteTest) {
      return res.status(404).json({ error: "Question not found" });
    }

    // If the question is deleted successfully, send a success response
    return res.status(200).json({ message: "Test deleted successfully" });
  } catch (error) {
    return next(new AppError(`${error.message}`, 500));
  }
};

const getUnAssignedQuestion = async (req, res, next) => {
  try {
    const assignedQuestionIds = await Test.distinct("questionIds");

    // Find all questions that are not in the assignedQuestionIds array
    const unAssignedQuestions = await Question.find({
      _id: { $nin: assignedQuestionIds },
    });

    // Send the unassigned questions as the response
    res.status(200).json(unAssignedQuestions);
  } catch (error) {
    // If an error occurs, send an error response
    return next(new AppError(`${error.message}`, 500));
  }
};

const assigneQuestion = async (req, res, next) => {
  try {
    const { testId, questionId } = req.body;
    // Find the test by testId and push the questionId into questionIds array
    const updatedTest = await Test.findByIdAndUpdate(testId, { $push: { questionIds: questionId } }, { new: true, useFindAndModify: false });

    if (!updatedTest) {
      return res.status(404).json({ message: "Test not found." });
    }

    res.status(200).json({ message: "Question assigned successfully.", test: updatedTest });
  } catch (error) {
    // If an error occurs, send an error response
    return next(new AppError(`${error.message}`, 500));
  }
};

const assignQuestionToTestsAndSubjects = async (req, res) => {
  try {
    const { questionId, testIds, subjectIds } = req.body;

    // Validate inputs
    if (!questionId || !Array.isArray(testIds) || !Array.isArray(subjectIds)) {
      return res.status(400).json({ message: "Invalid input." });
    }
    const testIdsOnly = testIds.map((test) => test.testId);
    const subjectIdsOnly = subjectIds.map((subject) => subject.subjectId);

    // Update the question with the new subject IDs
    const question = await Question.findByIdAndUpdate(questionId, { $set: { subjectIds: subjectIdsOnly } }, { new: true, useFindAndModify: false });

    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    // Add the question ID to the specified tests
    await Test.updateMany({ _id: { $in: testIdsOnly } }, { $addToSet: { questionIds: questionId } });

    res.status(200).json({ message: "Question assigned successfully.", question });
  } catch (err) {
    res.status(500).json({ message: "An error occurred while assigning the question.", error: err.message });
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
  createQuestionwithImageAswellOption,
  deleteQeustions,
  createQuestionImage,
  getDemoQuestion,
  getUnAssignedQuestion,
  assigneQuestion,
  deleteTest,
  assignQuestionToTestsAndSubjects,
  deleteSubjectFromTest,
  deleteTimeLimit,
};
