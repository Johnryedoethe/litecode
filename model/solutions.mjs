import sqlite3Package from 'sqlite3';

const sqlite3 = sqlite3Package.verbose()

export function createSolutionsDb() {
  const solutionDb = new sqlite3.Database('./solutions.db', (err) => {
    if (err) {
      throw new Error("error instantiating solutionDb")
    } else {
      console.log("solutionDb instancialised")
    }
  })

  solutionDb.run(`CREATE TABLE IF NOT EXISTS solutions (
      solutionId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      userSolution TEXT NOT NULL,
      completed BOOLEAN
    );`, (err) => {
      if (err) {
        throw new Error("error creating solutionDb") 
      } 
    }
  )

  return solutionDb
}

export async function getFromSolutionsDbIfExists(solutionDb, reqHash) {
  const { solutionId, userId } = reqHash
    return new Promise((resolve, reject) => {
      solutionDb.get(`SELECT * FROM solutions WHERE solutionId = ? AND userId = ?;`, [solutionId, userId], (err, row) => {
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

export async function createORUpdateSolutionDb(solutionsDb, reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  let resVal = null

  try {
    const tryUpdateFields = await updateFields(solutionsDb, reqHash)
    
    if (!tryUpdateFields) {
      return await createRow(solutionsDb, reqHash)
      console.log("created")
    }
    return tryUpdateFields
  } catch(err) {
    throw new Error(err)
  }
}

async function updateFields(solutionsDb, reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  return new Promise((resolve, reject) => {
    solutionsDb.get(`UPDATE solutions SET userSolution = ?, completed = ? WHERE solutionId = ? AND userId = ? 
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

async function createRow(solutionsDb, reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  return new Promise((resolve, reject) => {
    solutionsDb.run(`INSERT INTO solutions(solutionId, userId, userSolution, completed) VALUES(?, ?, ?, ?)`
        , [solutionId, userId, userSolution, completed], (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
      })
  })
  
}
