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
// app.use(express.static("uploads"));
//Routes
app.use("/api", appRoute);
app.use("/test", testRoute);

const port = process.env.PORT || 5001;

app.use(express.static(path.join(__dirname, "public")));
app.listen(port, () => console.log(`Server running on port ${port}`));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public", "index.htm"));
});
app.get("/*", (req, res) => {
  res.status(404);
  res.send("Web Page Not Found!");
});
