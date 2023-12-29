let worker = undefined;

window.onload = function () {
    worker = new Worker("worker.js");
    setWorkerMessageHandlers();

    worker.postMessage({msg: "load", params: []});
}

function setWorkerMessageHandlers() {
    worker.onmessage = (e) => {
        if (e.data.msg == "loaded") {
            initWasmModule(e.data.value);
            worker.postMessage({msg: "getBuffer", params: []});
        } else if (e.data.msg == "buffer") {
            let buffer = e.data.value;
            initBuffer(buffer.pointer, buffer.size);
            render();
        } else {
            console.log("Received unexpected result from worker", e);
        }
    };
}

let wasmModule;
let exports;
let memory;
let wasmByteMemoryArray;
let canvasElement;
let canvasContext;
let canvasImageData;

function initWasmModule(module) {
    wasmModule = module;

    exports = wasmModule.instance.exports;
    memory = exports.memory;
}

let bufferPointer;
let bufferSize;

function initBuffer(pointer, size) {
    bufferPointer = pointer;
    bufferSize = size;

    const wasmByteMemoryArray = new Uint8Array(memory.buffer);

    // Pull out the RGBA values from Wasm memory, the we wrote to in wasm,
    // starting at the checkerboard pointer (memory array index)
    imageDataArray = wasmByteMemoryArray.slice(
        bufferPointer,
        bufferPointer + bufferSize
    );

    canvasElement = document.querySelector("canvas");

    // Set up Context and ImageData on the canvas
    canvasContext = canvasElement.getContext("2d");
    canvasImageData = canvasContext.createImageData(
        canvasElement.width,
        canvasElement.height
    );

    // Clear the canvas
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    console.log("b", bufferPointer, "s", bufferSize);
}

function render() {

    // Set the values to the canvas image data
    canvasImageData.data.set(imageDataArray);

    // Clear the canvas
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Place the new generated checkerboard onto the canvas
    canvasContext.putImageData(canvasImageData, 0, 0);

    setInterval(() => {
        render();
    }, 1000);
}