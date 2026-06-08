require('dotenv').config();
const db = require('./db');

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
    process.exit(1);
  } else {
    console.log('Database initialization completed. You can now run: npm start');
    process.exit(0);
  }
});
