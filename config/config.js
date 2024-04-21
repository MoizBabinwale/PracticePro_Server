const mongoose = require("mongoose");
// const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// const uri = "mongodb+srv://Moizbabinwale:Moizbabinwala52520@practicepro1.qnydyms.mongodb.net/?retryWrites=true&w=majority&appName=PracticePro1";

mongoose
  .connect(process.env.CONNECTION)
  .then(() => {
    console.log("Successfully Connected to DB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

module.exports = mongoose;
