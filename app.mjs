import bodyParser from 'body-parser'
import express from 'express'
import { marked } from 'marked'
import cookieParser from 'cookie-parser'
import sqlite3Package from 'sqlite3';

import { loadProblems } from './util/problems.mjs'
import { createSolutionsTable, getFromSolutionsIfExists, createOrUpdateSolutions } from './model/solutions.mjs'
import { createUsersTable, validatePassword, registerAcc } from './model/users.mjs'
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
  // res.json(problems)
  res.render('home', {problems})
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
  if (!userCookie) {
    return res.status(200).json({message: "user not logged in"})
  }

  const userId = await getUserIdIfLoggedInSession(userCookie)

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

app.post('/registerAcc', async (req, res) => {
  const fields = req.body
  const curSessionId = req.cookies.authToken

  try {
    if (curSessionId !== undefined) {
      // remove cookie from web
      await logoutOfAccount(curSessionId)
    }

    const newUserId = await registerAcc(fields)
    
    if (!newUserId) {
      return
    }

    const sessionId = await createNewSession(newUserId.userId)
    // create cookie response, with newSessionId
    res.cookie('authToken', sessionId, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
    
    res.status(200).json({message: "account created"})
  } catch (err) {
    return res.status(500).json({message: "internal server error"})
  }
})

app.listen(3000, () => { console.log('Server is running on port 3000') })
