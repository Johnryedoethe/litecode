import { db } from '../app.mjs'
import crypto from 'crypto'

export async function createSessionsTable() {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
          sessionId TEXT NOT NULL PRIMARY KEY,
          userId TEXT NOT NULL,
          expireDate INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(userId)
        );`, (err) => {
          if (err) {
            throw new Error(err) 
            reject(err)
          } 

          resolve("sessions table created")
        }
      )
  })
}

export async function createNewSession(userId) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const curTimeInSeconds = Math.floor(Date.now() / 1000)

  const displacedSessionTime = 60 * 60
  const expireTime = curTimeInSeconds + displacedSessionTime

  try {
    await createSession({sessionId, userId, expireTime})
    const returnVal = await getSessionData(sessionId)
    return returnVal.sessionId
  } catch (err) {
    throw new Error(err)
  }
  
}

export async function getUserIdIfLoggedInSession(sessionId) {
  try {
    const sessionInfo = await getSessionData(sessionId)

    if (!sessionInfo) {
      return null
    }

    return sessionInfo.userId
  } catch (err) {
    throw new Error(err)
    return err
  }
}

async function getSessionData(sessionId) {
   return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM sessions WHERE sessionId = ?;`, [sessionId], (err, row) => {
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

async function createSession(fields) {
  const { sessionId, userId, expireTime } = fields

  return new Promise((resolve, reject) => {
      db.run(`INSERT INTO sessions(sessionId, userId, expireDate) VALUES(?, ?, ?)`
          , [sessionId, userId, expireTime], (err) => {
            if (err) {
              reject(err)
            } else {
              resolve("row created")
            }
        })
    })
}

export async function logoutOfAccount(sessionId) {
  // delete query at specific session id
  db.run(`DELETE FROM sessions WHERE sessionId = ?`, [sessionId], (err) => {
    if (err) {
      throw new Error(err)
    }
  })
}
