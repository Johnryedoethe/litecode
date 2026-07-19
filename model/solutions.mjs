import sqlite3 from 'sqlite3'

export async function createSolutionsDb() {
  const solutionDb = new sqlite3.Database('./solutions.db', (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log("solutionDb instancialised")
    }
  })

  solutionDb.run(`CREATE TABLE IF NOT EXISTS solutions (
      solutionId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      userSolution TEXT NOT NULL,
      completed BOOLEAN
    );`, (err) => {
      if (err) {
        console.log(err) 
      } 
    }
  )
} 

export async function getFromSolutionsDbIfExists(solutionDb, reqHash) {
  const { solutionId, userId } = reqHash
  let results = null

  solutionDb.get(`SELECT * FROM solutions WHERE solutionId = ? AND userId = ?
    `, [solutionId, userId], (err, resVals) => {
      if (err) {
        console.log(err)
      } else {
        if (resVals !== undefined) {
          results = resVals
        }
      }
  })

  // if resVals was empty return null else return the column vals
  return results
}

export async function createORUpdateSolutionDb(solutionDb, reqHash) {
  const { solutionId, userId, userSolution, completed } = reqHash
  let resVal = null

  if (getSolutionIfExists(reqHash) === null) {
    solutionDb.run(`INSERT INTO solutions(solutionId, userId, userSolution, completed) VALUES(?, ?, ?, ?)`
      , [solutionId, userId, userSolution, completed], (err) => {
        if (err) {
          console.log(err)
        } else {
          resVal = "created row"
        }
    })
  } else {
    solutionDb.run(`UPDATE solutions SET userSolution = ?, completed = ? WHERE solutionId = ? AND userId = ?`
    , [userSolution, completed, solutionId, userId], (err) => {
      if (err) {
        console.log(err)
      } else {
        resVal = "updated solution and status"
      }
    })
  }
}
