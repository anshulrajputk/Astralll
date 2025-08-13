const fs = require('fs');
const path = './welcomeData.json'; // JSON file path

// Load database
function loadDB() {
  try {
    if (!fs.existsSync(path)) fs.writeFileSync(path, '{}'); // create file if missing
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading DB:', err);
    return {};
  }
}

// Save database
function saveDB(data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

module.exports = { loadDB, saveDB };
