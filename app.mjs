import bodyParser from 'body-parser'
import express from 'express'
import { marked } from 'marked'
import path from 'path'

import { loadProblems } from './problems.mjs'

const problems = await loadProblems()

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

app.get('/problems/:id/:name', (req, res) => {
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

  const solutionTemplate = `function solution(input) {
  return ...
}
`

  res.render('problem', {problem, desc: marked.parse(problem.content), solutionTemplate})
})

app.listen(3000, () => { console.log('Server is running on port 3000') })
