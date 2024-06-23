const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
    const tokenParts = token.split(" ")[1];

    let decodeData;
    try {
      decodeData = await jwt.verify(tokenParts, process.env.JWT_SECRETE);
    } catch (error) {
      console.error(`Error verifying token: ${error}`);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized: Token expired" });
      } else {
        throw error;
      }
    }
    if (decodeData?.id) {
      req.userId = decodeData.id;
      next();
    } else {
      res.status(404).json({ message: "To Create/Update/Delete Must have userId" });
    }
  } catch (error) {
    console.error(`Error in auth middleware: ${error}`);
    res.status(500).json({ message: "Something went Wrong!" });
  }
};

module.exports = { auth };
