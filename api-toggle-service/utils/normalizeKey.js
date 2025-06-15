// utils/normalizeKey.js
module.exports = function normalizeKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};