import bodyParser from 'body-parser'
import express from 'express'
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
  res.json(problems)

  // res.render('home')
})

app.listen(3000, () => { console.log('Server is running on port 3000') })
