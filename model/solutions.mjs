import { db } from '../app.mjs'


export async function createSolutionsTable() {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS solutions (
          solutionId INTEGER NOT NULL,
          userId TEXT NOT NULL,
          userSolution TEXT NOT NULL,
          completed BOOLEAN,
          FOREIGN KEY (userId) REFERENCES users(userId)
        );`, (err) => {
          if (err) {
            throw new Error("error creating solutions table") 
            reject(err)
          } 

          resolve("created solutions table")
        }
      )
  })
}

export async function getFromSolutionsIfExists(reqHash) {
  const { solutionId, userId } = reqHash
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM solutions WHERE solutionId = ? AND userId = ?;`, [solutionId, userId], (err, row) => {
        if (err) {
          return reject(err)
        } 
        
        if (!row){
          return resolve(null)
        }
        resolve(row)
      })  
    })
}

export async function createOrUpdateSolutions(reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  let resVal = null

  try {
    const tryUpdateFields = await updateFields(reqHash)
    
    if (!tryUpdateFields) {
      return await createRow(reqHash)
      console.log("created")
    }
    return tryUpdateFields
  } catch(err) {
    throw new Error(err)
  }
}

async function updateFields(reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  return new Promise((resolve, reject) => {
    db.get(`UPDATE solutions SET userSolution = ?, completed = ? WHERE solutionId = ? AND userId = ? 
      RETURNING userSolution, completed`, 
      [userSolution, completed, solutionId, userId], (err, row) => {
        if (err) {
          reject(err)
        } else {
          if (!row) {
            resolve(null)
          }
          resolve(row)
        }
      })
  })
}

async function createRow(reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO solutions(solutionId, userId, userSolution, completed) VALUES(?, ?, ?, ?)`
        , [solutionId, userId, userSolution, completed], (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
      })
  })
  
}
