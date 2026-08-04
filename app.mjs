import bodyParser from 'body-parser'
import express from 'express'
import { marked } from 'marked'

import { loadProblems } from './problems.mjs'

import { createSolutionsDb, 
        getFromSolutionsDbIfExists, 
        createORUpdateSolutionDb } from './model/solutions.mjs'

const problems = await loadProblems()
const solutionsDb = await createSolutionsDb()


const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.set('views', './templates')
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

  let userData = undefined
  try {
    const getUserData = await getFromSolutionsDbIfExists(solutionsDb, {solutionId: problemId, userId})
    userData = getUserData
  } catch (err) {
    res.status(500).send(err.message, err.stack) 
  }
  
  let solutionTemplate = `function solution(input) {
    return ...
}`

  // null is default value for entry not found
  if (userData !== null) {
    const { userSolution, completed } = userData
    solutionTemplate = userSolution
    res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed})
    return
  }
  
  // res.json(problem.data.testcases)

  const completed = false
  res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate, completed})
})

app.post('/createOrUpdateSolution', async (req, res) => {
  const { status, userSolution, userId, solutionId } = req.body

  if (status !== "Completed") {
    try {
      const writeInfo = {completed: false, userSolution, userId, solutionId}
      const writeToSolutionDb = await createORUpdateSolutionDb(solutionsDb, writeInfo)
      return res.status(200).json({message: "no issues running"})
    } catch (err) {
      console.log(err)
      return res.status(500).json({message: "internal server error handling data, try again later"})
    }
      
  } 

  if (status === "Completed") {
    try {
      const writeInfo = {completed: true, userSolution, userId, solutionId}
      const writeToSolutionDb = await createORUpdateSolutionDb(solutionsDb, writeInfo)
      return res.status(200).json({message: "no issues running"})
    } catch (err) {
      return res.status(500).json({message: "internal server error handling data, try again later"})
    }
  }
  
})

app.listen(3000, () => { console.log('Server is running on port 3000') })
