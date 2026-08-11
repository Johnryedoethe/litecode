import bodyParser from 'body-parser'
import express from 'express'
import { marked } from 'marked'
import sqlite3Package from 'sqlite3';

import { loadProblems } from './problems.mjs'
import { createSolutionsTable, getFromSolutionsIfExists, createOrUpdateSolutions } from './model/solutions.mjs'
import { createUsers, validatePassword } from './model/users.mjs'


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
  await createUsers()
  await createSolutionsTable()
} catch (err) {
  console.error(err)
}


const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.set('views', './view')
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  // res.json(problems)
  res.render('home', {problems})
})

app.get('/problems/:id/:name', async (req, res) => {
  // get userId for querying db 
  const userId = "1"
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

  try {
    const getUserData = await getFromSolutionsIfExists({solutionId: problemId, userId})

    // null is default value for entry not found
    if (getUserData !== null) {
      const { userSolution, completed } = getUserData
      const solutionTemplate = userSolution
      return res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed})
    }

    const solutionTemplate = `function solution(input) {
    return ...
}`

    res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed: false})
  } catch (err) {
    res.status(500).send(err.message, err.stack) 
  }
  // res.json(problem.data.testcases)
})

app.post('/createOrUpdateSolution', async (req, res) => {
  const { status, userSolution, userId, solutionId } = req.body

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

app.listen(3000, () => { console.log('Server is running on port 3000') })
