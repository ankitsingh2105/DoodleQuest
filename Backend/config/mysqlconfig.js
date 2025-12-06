const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'database-4.cluster-c908o62io6j4.ap-south-1.rds.amazonaws.com',
    port: 3306,                                                  
    user: 'admin',                                               
    password: 'newThechauhan1!',                                     
    database: ''                                        
  });
  return connection;
}
// main().then(connection => {
//   console.log('MySQL Connected Successfully', connection);
// }).catch(err => {
//   console.error('Error connecting to MySQL', err);
// });
module.exports = main;
