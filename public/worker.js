self.onmessage = function(event) {
    const numberToSquare = event.data;
    
    // Perform computation
    const result = numberToSquare * numberToSquare;
    
    // Send the calculated result back to the main thread
    self.postMessage(result);
};