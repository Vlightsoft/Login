// middleware/adminKey.js
const AdminKey = require('../models/AdminKey');

module.exports = async function adminKey(req, res, next) {
  const key = req.headers['x-admin-key'];

  if (!key) {
    return res.status(401).json({ code: 401, response: 'error', message: 'Admin key missing' });
  }

  const match = await AdminKey.findOne({ key, disabled: false });
  if (!match) {
    return res.status(403).json({ code: 403, response: 'fail', message: 'Invalid admin key' });
  }

  req.isAdmin = true;
  next();
};
