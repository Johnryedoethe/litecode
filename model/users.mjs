import { db } from '../app.mjs'
import crypto from 'crypto'

import { createNewSession } from './sessions.mjs'

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

function validatePassword(fields, passwordGiven) {
  const { username, password } = fields

    const userHashedPass = hashPass(passwordGiven)

    console.log(userHashedPass)
    // validate hashed input and db info instead of undefined val
    if (password === userHashedPass) {
      return true
    } else {
      return false
    }
}

export async function userLogin(fields) {
  // assume the user is already validated their account details
  const { username, password } = fields
  try {
    const userFields = await getUserFieldsByUsername(username)

    console.log(userFields)
    if (!userFields) {
      return null
    }
    const isPassValid = validatePassword(userFields, password)

    if (!isPassValid) {
      return false
    }

    return await createNewSession(userFields.userId)
  } catch (err) {
    throw new Error(err)
  }
  
}

export async function registerAcc(fields) {
  const { username, email, password } = fields

  try {
    // see if account already exists
    const isUserRegisteredByEmail = await getUserFieldsByEmail(email)
    const isUserRegisteredByUsername = await getUserFieldsByUsername(username)


    if (isUserRegisteredByUsername || isUserRegisteredByEmail) {
      console.log(isUserRegisteredByUsername, isUserRegisteredByEmail)
      return null
    }

    await createAccount(password, username, email)

    return await getUserFieldsByUsername(username)
  } catch (err) {
    throw new Error(err)
    return err
  }
}

async function createAccount(password, username, email) {
  // email can be null
  // create uuid for userId
  const newUserId = crypto.randomUUID()
  const hashedPassword = hashPass(password)

  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users(userId, password, username, email) VALUES(?, ?, ?, ?)`
        , [newUserId, hashedPassword, username, email], (err) => {
          if (err) {
            reject(err)
          } else {
            resolve("queried")
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
  if (email === "") {
    return null
  }

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
  const saltedPass = "jimbob" + password
  const hashedPass = crypto.createHash('sha256').update(saltedPass).digest('hex')

  return hashedPass
}
