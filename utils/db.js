const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'welcomeData.json');

function loadDB() {
  try {
    if (!fs.existsSync(dbFile)) return {};
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load DB:', e);
    return {};
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
}

module.exports = { loadDB, saveDB };
