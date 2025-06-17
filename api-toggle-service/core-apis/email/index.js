const express = require('express');
const router = express.Router();
const validator = require('validator');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

const apiKeyMiddleware = require('../../middleware/apiKeyAuthAndLogger');

// Load domain lists
const loadJson = (filename) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'domain-lists', filename)));

const disposableDomains = loadJson('disposable.json');
const typoDomains = loadJson('typo.json');
const freeEmailDomains = loadJson('free.json');
const blacklistDomains = loadJson('blacklist.json');

function getDomain(email) {
  return email.split('@')[1].toLowerCase();
}

// 🔄 Shared validation logic
async function validateSingleEmail(email) {
  const domain = getDomain(email);
  const result = {
    email,
    domain,
    valid: false,
    reason: '',
    rfcCompliant: false,
    mxRecords: false,
    aRecord: false,
    disposable: false,
    suspicious: false,
    freeProvider: false,
    typoDomain: false,
    blacklisted: false
  };

  if (!validator.isEmail(email)) {
    result.reason = 'Invalid email format';
    return result;
  }

  result.valid = true;

  result.rfcCompliant = validator.isEmail(email, {
    allow_utf8_local_part: false,
    require_tld: true
  });

  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) result.mxRecords = true;
  } catch {
    result.reason = 'No MX records';
  }

 try {
  const aRecords = await dns.lookup(domain, { all: true }); // return array of A records
  result.aRecord = aRecords.length > 0;

  result.aRecordDetails = aRecords.map((record) => ({
    ip: record.address || null,
    family: record.family === 6 ? 'IPv6' : record.family === 4 ? 'IPv4' : record.family || 'Unknown'
  }));

  // Optional log
  // console.log(`✅ A record(s) found for ${domain}:`, result.aRecordDetails);
} catch (err) {
  result.reason ||= 'Domain inactive';
  result.aRecord = false;
  result.aRecordDetails = [{
    ip: null,
    family: 'Unknown'
  }];
  // console.warn(`❌ A record NOT found for ${domain}:`, err.message);
}


  if (disposableDomains.includes(domain)) result.disposable = true;
  if (email.includes('+') || /(?:spam|test|junk)/i.test(email)) result.suspicious = true;
  if (freeEmailDomains.includes(domain)) result.freeProvider = true;
  if (typoDomains.includes(domain)) result.typoDomain = true;
  if (blacklistDomains.includes(domain)) result.blacklisted = true;

  let score = 0;
  if (result.valid) score += 20;
  if (result.rfcCompliant) score += 10;
  if (result.mxRecords) score += 20;
  if (result.aRecord) score += 10;
  if (!result.disposable) score += 10;
  if (!result.suspicious) score += 10;
  if (!result.typoDomain) score += 10;
  if (!result.blacklisted) score += 10;

  result.score = score;

  if (score >= 90) result.conclusion = '✅ Likely Safe';
  else if (score >= 70) result.conclusion = '⚠️ Potentially Risky';
  else if (score >= 40) result.conclusion = '❗ Suspicious';
  else result.conclusion = '🚫 Unsafe or Invalid';

  if (result.blacklisted) {
    result.finalizedStatus = 'Blacklisted';
  } else if (result.disposable) {
    result.finalizedStatus = 'Disposable';
  } else if (result.typoDomain) {
    result.finalizedStatus = 'Typo Domain';
  } else if (result.freeProvider) {
    result.finalizedStatus = 'Free Email Provider';
  } else if (!result.mxRecords) {
    result.finalizedStatus = 'No MX Records';
  } else {
    result.finalizedStatus = 'Normal / Custom Domain';
  }

  return result;
}



const DOMAIN_LISTS_PATH = path.join(__dirname, 'domain-lists');
const allowedFiles = ['blacklist', 'disposable', 'typo', 'free'];



router.post('/remove-from-list', apiKeyMiddleware, async (req, res) => {
  const { listName, domains } = req.body;

  if (!allowedFiles.includes(listName)) {
    return res.status(400).json({
      message: `Invalid list name. Must be one of: ${allowedFiles.join(', ')}`
    });
  }

  if (!Array.isArray(domains) || domains.some(d => typeof d !== 'string')) {
    return res.status(400).json({
      message: 'domains must be a JSON array of strings like ["abc.com", "xyz.net"]'
    });
  }

  const filePath = path.join(DOMAIN_LISTS_PATH, `${listName}.json`);

  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const existingSet = new Set(existing.map(e => e.toLowerCase()));
    const incomingSet = new Set(domains.map(d => d.toLowerCase()));

    const removed = [];
    const notFound = [];

    for (const domain of incomingSet) {
      if (existingSet.has(domain)) {
        removed.push(domain);
        existingSet.delete(domain);
      } else {
        notFound.push(domain);
      }
    }

    const updatedList = Array.from(existingSet).sort();
    fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2));

    res.json({
      message: `✅ ${listName}.json updated`,
      removed,
      notFound,
      total: updatedList.length
    });
  } catch (err) {
    console.error(`❌ Failed to update ${listName}.json:`, err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/update-list', apiKeyMiddleware, async (req, res) => {
  const { listName, domains } = req.body;

  if (!allowedFiles.includes(listName)) {
    return res.status(400).json({
      message: `Invalid list name. Must be one of: ${allowedFiles.join(', ')}`
    });
  }

  if (!Array.isArray(domains) || domains.some(d => typeof d !== 'string')) {
    return res.status(400).json({
      message: 'domains must be a JSON array of strings like ["abc.com", "xyz.net"]'
    });
  }

  const filePath = path.join(DOMAIN_LISTS_PATH, `${listName}.json`);

  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const existingSet = new Set(existing.map(e => e.toLowerCase()));
    const incomingSet = new Set(domains.map(d => d.toLowerCase()));

    const alreadyExists = [];
    const newlyAdded = [];

    for (const domain of incomingSet) {
      if (existingSet.has(domain)) {
        alreadyExists.push(domain);
      } else {
        newlyAdded.push(domain);
        existingSet.add(domain);
      }
    }

    const mergedSorted = Array.from(existingSet).sort();
    fs.writeFileSync(filePath, JSON.stringify(mergedSorted, null, 2));

    res.json({
      message: `✅ ${listName}.json updated`,
      added: newlyAdded,
      duplicates: alreadyExists,
      total: mergedSorted.length
    });
  } catch (err) {
    console.error(`❌ Failed to update ${listName}.json:`, err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// ✅ Single email validation
router.post('/validate', apiKeyMiddleware, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const result = await validateSingleEmail(email);
  res.json(result);
});

// ✅ Bulk email validation
router.post('/bulk-validate', apiKeyMiddleware, async (req, res) => {
  const { emails } = req.body;
 if (!Array.isArray(emails) || emails.length === 0) {
  return res.status(400).json({ message: 'emails must be a non-empty array' });
}

if (emails.length > 500) {
  return res.status(413).json({
    message: 'Maximum limit exceeded. You can validate up to 500 emails at a time.'
  });
}
  try {
    const results = await Promise.all(emails.map(validateSingleEmail));
    res.json({ count: results.length, results });
  } catch (err) {
    console.error('❌ Bulk validation failed:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
