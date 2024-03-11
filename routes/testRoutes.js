const express = require("express");
const {
  createSubject,
  createQuestion,
  createTest,
  getSubjectsForTest,
  getAllSubjects,
  checkAnswer,
  createTimeLimit,
  getquestionswithLimit,
  createDifficulty,
  updateQuestions,
  appendToTest,
  getDifficulty,
  getTimeLimits,
  getQuestionsBySubjectAndTestId,
  getAllTest,
  getAllResult,
  createQuestionwithImageAswellOption,
  deleteQeustions,
  createQuestionImage,
  getDemoQuestion,
} = require("../Controllers/testController");
const { auth } = require("../middleware/auth");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/createSubject", auth, createSubject);
router.post("/createQuestion", auth, createQuestion);
router.post("/createQuestionWithImage", auth, upload.array("avatar[]"), createQuestionwithImageAswellOption);
router.post("/createQuestionImage", auth, upload.single("questionImage"), createQuestionImage);
router.post("/createTest", auth, createTest);
router.post("/appendToTest", auth, appendToTest);
router.post("/getQuestion", auth, getQuestionsBySubjectAndTestId);
router.get("/getDemoQuestion", auth, getDemoQuestion);
router.post("/updateQuestion", auth, updateQuestions);
router.post("/getquestionswithLimit", auth, getquestionswithLimit);
router.post("/checkAnswer", auth, checkAnswer);
router.get("/getAllResult", auth, getAllResult);
router.post("/deleteQeustions", auth, deleteQeustions);

router.get("/getAllSubjects", auth, getAllSubjects);
router.get("/getSubjects/:testId", auth, getSubjectsForTest);

router.post("/createTimeLimit", auth, createTimeLimit);
router.post("/createDifficulty", auth, createDifficulty);
router.get("/getTimeLimits", auth, getTimeLimits);
router.get("/getDifficulty", auth, getDifficulty);
router.get("/getAllTest", getAllTest);
module.exports = router;
