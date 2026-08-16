import { readdir, readFile } from 'node:fs/promises'
import matter from 'gray-matter'

const PROBLEMS_FOLDER = './problems'

// Loads .md files in `problems` folder.
// Returns an array of problems.
export async function loadProblems() {
  const files = await readdir(PROBLEMS_FOLDER)

  const problems = []

  for (const file of files) {
    if (!file.endsWith('.md')) {
      continue
    }

    const problem = await loadProblem(PROBLEMS_FOLDER + '/' + file)
    problems.push(problem)
  }

  return problems
}

async function loadProblem(filePath) {
  const fileContent = await readFile(filePath)
  return matter(fileContent)
}
