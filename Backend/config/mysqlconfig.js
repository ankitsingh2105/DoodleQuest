const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'doodleDB',
    password: 'thechauhan1'
  });
  return connection;
}

module.exports = main;
