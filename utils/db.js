// utils/db.js
const fs = require('fs');
const path = require('path');

// JSON file ka path (project ke andar utils folder ke andar)
const dbFile = path.join(__dirname, 'welcomeData.json');

function loadDB() {
  if (!fs.existsSync(dbFile)) {
    // Agar file nahi hai to empty object return karo
    return {};
  }
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('DB load karte waqt error:', error);
    return {};
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('DB save karte waqt error:', error);
  }
}

module.exports = {
  loadDB,
  saveDB,
};
