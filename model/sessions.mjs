import { db } from '../app.mjs'


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
  // create uuid for session
  // not finsihed
  const sessionId = "36"
  const curTimeInSeconds = Math.floor(Date.now() / 1000)

  const displacedSessionTime = 60 * 60
  const expireTime = curTimeInSeconds + displacedSessionTime

  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sessions(sessionId, userId, expireDate) VALUES(?, ?, ?)`
        , [sessionId, userId, expireTime], (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
      })
  })
}

export async function getUserIdIfLoggedIn(sessionId) {
  try {
    const sessionInfo = await isUserLoggedIn()

    if (!sessionInfo) {
      return null
    }

    return sessionInfo
  } catch (err) {
    throw new Error(err)
    return err
  }
}

async function isUserLoggedIn(sessionId) {
   return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM sessions WHERE sessionId = ?;`, [sessionId], (err, row) => {
          if (err) {
            reject(err)
          } 
          
          if (!row){
            resolve(null)
          }
        
          resolve(row.userId)
        })  
      })
}
