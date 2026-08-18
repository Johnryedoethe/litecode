import bodyParser from 'body-parser'
import express from 'express'
import { marked } from 'marked'
import cookieParser from 'cookie-parser'
import sqlite3Package from 'sqlite3';

import { loadProblems } from './util/problems.mjs'
import { createSolutionsTable, getFromSolutionsIfExists, createOrUpdateSolutions } from './model/solutions.mjs'
import { createUsersTable, userLogin, registerAcc } from './model/users.mjs'
import { createSessionsTable, createNewSession, getUserIdIfLoggedInSession, logoutOfAccount } from './model/sessions.mjs'

const sqlite3 = sqlite3Package.verbose()

const problems = await loadProblems()

export const db = new sqlite3.Database('./main.db', (err) => {
    if (err) {
      throw new Error("error instantiating solutionDb")
    } else {
      console.log("db instancialised")
    }
  })

try {
  await createUsersTable()
  await createSolutionsTable()
  await createSessionsTable()
} catch (err) {
  console.error(err)
}


const app = express()


app.use(bodyParser.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended:true}))

app.set('views', './view')
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  const curSessionId = req.cookies.authToken

  // logic to return completed problems or problems with progress
  if (curSessionId === undefined) {
    return res.render('home', {problems})
  }

  return res.render('home', {problems})
})

app.get('/problems/:id/:name', async (req, res) => {
  const problemId = req.params.id

  let problem = null
  for (let i = 0; i < problems.length; i++) {
    if (problems[i].data.id === problemId) {
      problem = problems[i]
      break
    }
  }
  
  if (!problem) {
    res.status(404).send('Problem not found')
    return
  }


  // get sessionId from cookie
  const sessionId = req.cookies.authToken

  try {
    let solutionTemplate = `function solution(input) {
    return ...
}`

    if (!sessionId) {
      return res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed: false})
    }

    const userId = await getUserIdIfLoggedInSession(sessionId)

    if (!userId) {
      return res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed: false})
    }

    const getUserSolutionData = await getFromSolutionsIfExists({solutionId: problemId, userId})

    // null is default value for entry not found
    if (getUserSolutionData !== null) {
      const { userSolution, completed } = getUserSolutionData
      solutionTemplate = userSolution
      return res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed})
    }

    res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed: false})
  } catch (err) {
    res.status(500).send(err.message, err.stack) 
  }
  // res.json(problem.data.testcases)
})

app.post('/createOrUpdateSolution', async (req, res) => {
  const { status, userSolution, solutionId } = req.body
  // validate user session
  const userCookie = req.cookies.authToken
  // if cookie doesn't exist, default is undefined for no cookie
  if (userCookie === undefined) {
    return res.status(200).json({message: "user not logged in"})
  }

  // see if there is an active session that should still be running
  // all sessions should be running on the db that is served to user
  // user has cookie that is checked to see whether it is in sync with 'real' sessions
  const userId = await getUserIdIfLoggedInSession(userCookie)

  // default value of non existant row is null
  if (!userId) {
    return res.status(200).json({message: "user not logged in"})
  }

  if (status !== "Completed") {
    try {
      const writeInfo = {completed: false, userSolution, userId, solutionId}
      const writeToSolutionDb = await createOrUpdateSolutions(writeInfo)
      return res.status(200).json({message: "no issues running"})
    } catch (err) {
      return res.status(500).json({message: "internal server error handling data, try again later"})
    }
      
  } 

  if (status === "Completed") {
    try {
      const writeInfo = {completed: true, userSolution, userId, solutionId}
      const writeToSolutionDb = await createOrUpdateSolutions(writeInfo)
      return res.status(200).json({message: "no issues running"})
    } catch (err) {
      return res.status(500).json({message: "internal server error handling data, try again later"})
    }
  }
})

app.get('/userRegistration', (req, res) => {
  res.render('userRegister')
})

app.get('/userLogin', (req, res) => {
  res.render('userLogin')
})

app.post('/registerAcc', async (req, res) => {
  const fields = req.body
  const curSessionId = req.cookies.authToken

  try {
    if (curSessionId !== undefined) {
      // remove cookie from web
      res.clearCookie(curSessionId)
      await logoutOfAccount(curSessionId)
    }

    const newUserId = await registerAcc(fields)
    
    if (!newUserId) {
      return res.status(401).json({message: "acc could not be registered"})
    }

    const sessionId = await createNewSession(newUserId.userId)
    // create cookie response, with newSessionId
    res.cookie('authToken', sessionId, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
    
    return res.status(200).json({message: "account created"})
  } catch (err) {
    return res.status(500).json({message: "internal server error"})
  }
})

app.post('/login', async (req, res) => {
  const fields = req.body
  try {
    const newSessionId = await userLogin(fields)

    if (!newSessionId) {
      return res.status(401).json({message: "invalid username or password"})
    }

    const curSessionId = req.cookies.authToken

    if (curSessionId !== undefined) {
      res.clearCookie(curSessionId)
      await logoutOfAccount(curSessionId)
    }

    res.cookie('authToken', newSessionId, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })

    res.status(200).json({message: "user logged in"})
  } catch (err) {
    res.status(500).json({message: "error logging in"})
  }
})


app.listen(3000, () => { console.log('Server is running on port 3000') })
