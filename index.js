const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const path = require("path");
require("./config/config");
const appRoute = require("./routes/UserRoutes.js");
app.use(cors());
const testRoute = require("./routes/testRoutes.js");
app.use(express.json({ limit: "30mb", extended: true }));
app.use("/uploads", express.static("uploads"));
// app.use(express.static("uploads"));
const errorHandler = require("./middleware/errorhandler.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use("/api", appRoute);
app.use("/test", testRoute);

const isTestMode = process.env.NODE_ENV === "test" ? true : false;

const port = process.env.PORT || 5001;
app.use(errorHandler);
app.use(express.static(path.join(__dirname, "public")));
app.listen(port, () => console.log(`Server running on port ${port}`));

app.get("/api/getkey", (req, res) => {
  res.status(200).json({ key: isTestMode ? process.env.TEST_KEY_ID : process.env.KEY_ID });
});
app.get("/", (req, res) => {
  res.status(200).send("Practice Pro Server Started");
});
