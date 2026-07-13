self.onmessage = function(event) {
    const userCode = event.data
    
    const funcBody = `const userFunc = ${userCode}; return userFunc();`

    const userFunction = new Function('input', funcBody)

    const result = userFunction()
    
    // Send the calculated result back to the main thread
    self.postMessage(result);
}
