self.onmessage = function(event) {
    const userCode = event.data;
    
    const userFunction = new Function('input', userCode)
    // Perform computation
    const result = userFunction()
    
    // Send the calculated result back to the main thread
    self.postMessage(result);
};