const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'database-4.cluster-c908o62io6j4.ap-south-1.rds.amazonaws.com',
    port: 3306,                                                  
    user: 'admin',                                               
    password: 'newThechauhan1!',                                     
    database: 'doodleDB'                                        
  });
  return connection;
}

module.exports = main;
