// scripts/generateAdminKey.js
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { connectDB } = require('../db');
const AdminKey = require('../models/AdminKey');

(async () => {
  await connectDB();

  const key = crypto.randomBytes(32).toString('hex');
  const label = process.argv[2] || 'Admin Access';

  const existing = await AdminKey.findOne({ label });
  if (existing) {
    console.log('❗Key with this label already exists:', existing.key);
    process.exit(1);
  }

  const newKey = await AdminKey.create({ key, label });
  console.log('✅ Admin Key Created:', newKey.key);

  process.exit(0);
})();
