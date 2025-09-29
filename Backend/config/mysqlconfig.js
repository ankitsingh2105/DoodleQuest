const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'database-1.cx8gi0quaphm.ap-south-1.rds.amazonaws.com',
    port: 3306,                                                  
    user: 'ankit',                                               
    password: 'newThechauhan1!',                                     
    database: 'doodleDB'                                        
  });
  return connection;
}

module.exports = main;
