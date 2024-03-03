const mongoose = require("mongoose")
require('dotenv').config();


mongoose.connect(process.env.CONNECTION).then(() => {
    console.log("Successfully Connected to DB");
})
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

module.exports = mongoose