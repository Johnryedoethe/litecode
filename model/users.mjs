import { db } from '../app.mjs'


export async function createUsers() {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
          userId TEXT NOT NULL,
          password TEXT NOT NULL,
          username TEXT NOT NULL,
          email TEXT
        );`, (err) => {
          if (err) {
            throw new Error(err) 
            reject(err)
          } 

          resolve("users created")
        }
      )
  })
  
}

export async function validatePassword(usernameTextField, userPasswordGiven) {
    try {
      const userFields = await getUserFields(usernameTextField)
      // hash password in a variable
      // const userHashedPass = ...

      if (!userFields) {
        return null
      }

      // validate hashed input and db info instead of undefined val
      if (userFields.password === undefined) {
        return true
      } else {
        return false
      }

    } catch (err) {
      throw new Error(err)
      return err
    }
}

async function getUserFields(usernameTextField) {
  return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ? OR email = ?;`, [usernameTextField, usernameTextField], (err, row) => {
          if (err) {
            reject(err)
          } 
          
          if (!row){
            resolve(null)
          }
          resolve(row)
        })  
      })
}
