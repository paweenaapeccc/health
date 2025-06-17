// lib/db.js
/*import mysql from 'mysql2/promise'

let connection

export async function connectDB() {
  if (!connection) {
    connection = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'health',
    })
  }
  return connection
}
*/

import mysql from 'mysql2/promise'

let pool

export async function connectDB() {
  if (!pool) {
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'health',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}
