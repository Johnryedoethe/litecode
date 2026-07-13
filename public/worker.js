self.onmessage = function(event) {
    try {
      const { input, userCode } = event.data

      const funcBody = `const userFunc = ${userCode}; return userFunc(input);`
      const userFunction = new Function('input', funcBody)

      const result = userFunction(input)
      self.postMessage({result, success: true})
    } catch (err) {
      self.postMessage({result: err, success: false})
    }
}
