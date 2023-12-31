let worker = undefined;

window.onload = function () {
    worker = new Worker("worker.js");
    
    worker.onmessage = (e) => {
        if (e.data.msg == "loaded") {
            worker.postMessage({msg: "start"});
        } else {
            console.log("Received unexpected result from worker", e);
        }
    };

    const offscreenCanvas = document.querySelector("canvas").transferControlToOffscreen();
    // The second parameter of postMessage is an array of transferrable objects that you want to _transfer_
    // rather than clone to the worker. This only works with transferrable objects like the offscreen canvas.
    worker.postMessage({msg: "load", params: [offscreenCanvas]}, [offscreenCanvas]);
    // worker.postMessage({msg: "load", params: []});
}

function solve() {
    worker.postMessage({msg: "solve"});
}