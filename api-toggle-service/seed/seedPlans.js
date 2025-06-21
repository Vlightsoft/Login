require('dotenv').config();
const mongoose = require('mongoose');
const PlanTemplate = require('../models/PlanTemplate');
const { connectDB } = require('../db');

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    maxApiKeys: 1,
    support: "Basic community support",
    description: "Best for personal testing and exploration.",
    limits: {
      "File Merger APIs": "3,000",
      "Conversion Utilities": "3,000",
      "Date/Time APIs": "5,000",
      "File Validators": "3,000",
      "Email Validation": "3,000",
      "Virus Scanner": "3,000",
      "Bulk File Merger": "500",
      "Bulk File Convertor": "500",
      "Image Processor APIs":"500",
      "Domain Limit":"5",
       "From Address Limit": "10"
    },
  },
  {
    id: "basic",
    name: "Basic",
    price: "$19/month",
    maxApiKeys: 3,
    support: "Standard email support (48hr response)",
    description: "For early-stage apps and hobby projects.",
    limits: {
      "File Merger APIs": "30,000",
      "Conversion Utilities": "30,000",
      "Date/Time APIs": "50,000",
      "File Validators": "30,000",
      "Email Validation": "30,000",
      "Virus Scanner": "30,000",
      "Bulk File Merger": "10,000",
      "Bulk File Convertor": "10,000",
       "Image Processor APIs":"500",
       "Document Parser APIs":"500",
        "Domain Limit":"5",
         "From Address Limit": "10"
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$49/month",
    maxApiKeys: 5,
    support: "Priority support (24hr resolution)",
    description: "Ideal for mid-size teams and business use.",
    limits: {
      "File Merger APIs": "150,000",
      "Conversion Utilities": "150,000",
      "Date/Time APIs": "300,000",
      "File Validators": "150,000",
      "Email Validation": "150,000",
      "Virus Scanner": "150,000",
      "Bulk File Merger": "30,000",
      "Bulk File Convertor": "30,000",
       "Image Processor APIs":"500",
       "Document Parser APIs":"500",
        "Domain Limit":"5",
         "From Address Limit": "10"
    },
    tag: "Best Value"
  },
  {
    id: "professional",
    name: "Professional",
    price: "$300/month",
    maxApiKeys: 10,
    support: "SLA, dedicated manager, 24/7 support",
    description: "Unlimited use for production-grade platforms.",
    limits: {
      "File Merger APIs": "Unlimited",
      "Conversion Utilities": "Unlimited",
      "Date/Time APIs": "Unlimited",
      "File Validators": "Unlimited",
      "Email Validation": "Unlimited",
      "Virus Scanner": "Unlimited",
      "Bulk File Merger": "Unlimited",
      "Bulk File Convertor": "Unlimited",
       "Image Processor APIs":"500",
       "Document Parser APIs":"500",
        "Domain Limit":"5",

         "From Address Limit": "10"
    },
  },
  {
    id: "custom",
    name: "Custom",
    price: "Contact Us",
    maxApiKeys: "Unlimited",
    support: "Custom SLAs, bulk pricing, full support",
    description: "Custom contracts, usage needs, and infrastructure.",
    limits: {
      "File Merger APIs": "Custom",
      "Conversion Utilities": "Custom",
      "Date/Time APIs": "Custom",
      "File Validators": "Custom",
      "Email Validation": "Custom",
      "Virus Scanner": "Custom",
      "Bulk File Merger": "Custom",
      "Bulk File Convertor": "Custom",
       "Image Processor APIs":"Custom",
       "Document Parser APIs":"Custom",
        "Domain Limit":"Custom",
         "From Address Limit": "10"
    },
  },
];

(async () => {
  try {
    await connectDB();
    await PlanTemplate.deleteMany(); // Clear existing
    await PlanTemplate.insertMany(plans);
    console.log('✅ Predefined plans seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding plans:', err);
    process.exit(1);
  }
})();
