import { db } from '../app.mjs'


export async function createUsersTable() {
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

export async function validatePassword(username, userPasswordGiven) {
    try {
      const userFields = await getUserFieldsByUsername(username)
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

export async function registerAcc(fields) {
  const { username, email, password } = fields

  try {
    if (await getUserFieldsByUsername(username) || await getUserFieldsByEmail(email)) {
      return null
    }

    const hashedPassword = hashPass(password)
    const accDetails = createAccount(hashedPassword, username, email)

    // create new session
  } catch (err) {
    throw new Error(err)
    return err
  }
}

async function createAccount(password, username, email) {
  // email can be null

  // create uuid for userId
  const newUserId = ""

  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users(userId, password, username, email) VALUES(?, ?, ?, ?)`
        , [newUserId, password, username, email], (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
      })
  })
}

async function getUserFieldsByUsername(username) {
  return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ?;`, [username], (err, row) => {
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

async function getUserFieldsByEmail(email) {
  return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE email = ?;`, [email], (err, row) => {
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

function hashPass(password) {
  // return value from hash function
  return password
}
