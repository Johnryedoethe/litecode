import sqlite3 from 'sqlite3'

export function initialiseUsersDb() {
  const usersDb = new sqlite3.Database('./users.db', (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log("usersDb instancialised")
    }
  })

  usersDb.run(`CREATE TABLE IF NOT EXISTS solutions (
      userId TEXT NOT NULL,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      email TEXT
    );`, (err) => {
      if (err) {
        console.log(err) 
      } 
    }
  )

  return usersDb
}
