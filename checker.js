let worker = undefined;
let worker2 = undefined;
let memory = undefined;

window.onload = function () {
    worker = new Worker("worker.js");
    worker2 = new Worker("solveworker.js");

    memory = new WebAssembly.Memory({ initial: 1024, maximum: 2048, shared: true });


    worker.onmessage = (e) => {
        if (e.data.msg == "loaded") {
            worker2.postMessage({msg: "load", params: [memory]});
        } else {
            console.log("Received unexpected result from worker", e);
        }
    };

    const offscreenCanvas = document.querySelector("canvas").transferControlToOffscreen();
    // const memory = new SharedArrayBuffer(16);
    // The second parameter of postMessage is an array of transferrable objects that you want to _transfer_
    // rather than clone to the worker. This only works with transferrable objects like the offscreen canvas.
    // worker.postMessage();
    worker.postMessage({msg: "load", params: [offscreenCanvas, memory]}, [offscreenCanvas]);

    worker2.onmessage = (e) => {
        if (e.data.msg == "loaded") {
            console.log("Solve worker loaded");

            // When the second worker has been initialised, start the first worker render job
            worker.postMessage({msg: "start"});
        } else {
            console.log("Received unexpected result from worker", e);
        }
    };
}

function solve() {
    worker2.postMessage({msg: "solve"});
}