self.onmessage = function(event) {
  try {
    const { testcases, userFuncBody } = event.data

    const funcBody = `const userFunc = ${userFuncBody}; return userFunc(input);`
    const userFunction = new Function('input', funcBody)

    for (let i = 0; i < testcases.length; i++) {
      const caseInput = testcases[i].input
      const stdout = userFunction(caseInput)

      if (stdout !== testcases[i].output) {
        self.postMessage({result: {Input: caseInput, stdout, expected: testcases[i].output, casesPassed: `${i + 1}/${testcases.length}`}, status: "Failed"})
        return
      }
    }

    self.postMessage({result: "${testcases.length}/${testcases.length}", status: "Complete"})
  } catch (err) {
    self.postMessage({err, status: "Error found"})
  }
}
