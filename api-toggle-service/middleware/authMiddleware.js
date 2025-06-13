const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      response: "error",
      message: { error: "No token provided" }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        code: 404,
        response: "error",
        message: { error: "User not found" }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({
      code: 403,
      response: "error",
      message: { error: "Invalid token" }
    });
  }
};

module.exports = authMiddleware;
