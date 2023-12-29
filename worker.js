console.log("Running worker");


let canvas;

const loadCanvas = (offScreenCanvas) => {
    canvas = offScreenCanvas;
    console.log("Loaded offscreen canvas into worker", canvas);
}

const onyx_decode_text = (ptr, len) => {
    let v = new DataView(wasmInstance.exports.memory.buffer);

    let s = "";
    for (let i = 0; i < len; i++) {
        s += String.fromCharCode(v.getUint8(ptr + i));
    }

    return s;
}

const onyx_print_str = (ptr, len) => {
    console.log(onyx_decode_text(ptr, len));
}

const onyx_get_str = (str) => {
    let view = new DataView(wasmInstance.exports.memory.buffer);
    let strptr = view.getUint32(str, true);
    let strlen = view.getUint32(str + 4, true);

    return onyx_decode_text(strptr, strlen);
}

const importWasmModule = async (wasmModuleUrl) => {
    let importObject = {
        host: {
            print_str: onyx_print_str,
            time: Date.now
        }
    };

    return await WebAssembly.instantiateStreaming(
        fetch(wasmModuleUrl),
        importObject
    );
}

let wasmInstance = undefined;
let exports;
let memory;

let bufferPointer;
let bufferSize;
let wasmByteMemoryArray;
let imageDataArray;
let canvasElement;
let canvasContext;
let canvasImageData;


const loadWasm = async () => {
    console.log("Loading wasm module");
    wasmModule = await importWasmModule("./checker.wasm");
    console.log("Loaded wasm module", wasmModule);

    // Initialise the Onyx runtime - this is needed to set up heap space and other things
    wasmModule.instance.exports._initialize();
    wasmInstance = wasmModule.instance;
    console.log("Got wasm instance: ", wasmInstance);

    bufferPointer = wasmInstance.exports.getBufferPointer();
    bufferSize = wasmInstance.exports.getBufferSize();

    console.log("Got buffer pointer and size", bufferPointer, bufferSize);

    exports = wasmInstance.exports;
    console.log("Got exports", exports);
    memory = exports.memory;
    wasmByteMemoryArray = new Uint8Array(memory.buffer);

    imageDataArray = wasmByteMemoryArray.slice(
        bufferPointer,
        bufferPointer + bufferSize
    );

    // Get our canvas element from our index.html
    // const canvasElement = document.querySelector("canvas");

    // Set up Context and ImageData on the canvas
    canvasContext = canvas.getContext("2d");
    canvasImageData = canvasContext.createImageData(
        canvas.width,
        canvas.height
    );

    // Set the values to the canvas image data
    canvasImageData.data.set(imageDataArray);

    // Clear the canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Place the new generated checkerboard onto the canvas
    canvasContext.putImageData(canvasImageData, 0, 0);
}

// Create a Uint8Array to give us access to Wasm Memory
// const inputByteArray = stringToByteArray("Hello world");
// const inputPointer = wasmInstance.exports.__alloc(inputByteArray.length);
// const wasmMemory = new Uint8Array(wasmModule.instance.exports.memory);
// wasmMemory.set(inputByteArray, inputPointer);

// function stringToByteArray(str) {
//     const byteArray = new Uint8Array(str.length);
//     for (let i = 0; i < str.length; i++) {
//       byteArray[i] = str.charCodeAt(i);
//     }
//     return byteArray;
// }

onmessage = async (e) => {
    if (e.data.msg == "load") {
        loadCanvas(e.data.params[0]);
        await loadWasm();
        postMessage({msg: "loaded"});
    } else if (e.data.msg == "start") {
        render();
        setInterval(render, 1000);
    } else {
        console.log("Received unknown message", e.data);
    }
};


function render() {
    console.log("Rendering");
    // Generate a new checkboard in wasm
    exports.render(BigInt(Date.now()));

    // Set the values to the canvas image data
    canvasImageData.data.set(imageDataArray);

    // Clear the canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Place the new generated checkerboard onto the canvas
    canvasContext.putImageData(canvasImageData, 0, 0);
}

// const runWasm = async () => {

//     console.log("Loading wasm module");
//     // Instantiate our wasm module
//     const wasmModule = await importWasmModule("./checker.wasm");

//     console.log("Loaded wasm module", wasmModule);

//     // Get our exports object, with all of our exported Wasm Properties
//     const exports = wasmModule.instance.exports;

//     // Get our memory object from the exports
//     const memory = exports.memory;

//     // Create a Uint8Array to give us access to Wasm Memory
//     const wasmByteMemoryArray = new Uint8Array(memory.buffer);

//     // Get our canvas element from our index.html
//     const canvasElement = document.querySelector("canvas");

//     // Set up Context and ImageData on the canvas
//     const canvasContext = canvasElement.getContext("2d");
//     const canvasImageData = canvasContext.createImageData(
//         canvasElement.width,
//         canvasElement.height
//     );

//     // Clear the canvas
//     canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

//     const getDarkValue = () => {
//         return Math.floor(Math.random() * 100);
//     };

//     const getLightValue = () => {
//         return Math.floor(Math.random() * 127) + 127;
//     };

//     const drawCheckerBoard = () => {

//         // Generate a new checkboard in wasm
//         const result = exports.generateCheckerBoard(
//             getDarkValue(),
//             getDarkValue(),
//             getDarkValue(),
//             getLightValue(),
//             getLightValue(),
//             getLightValue()
//         );

//         const bufferPointer = exports.getCheckerboardBuffer();
//         const bufferSize = exports.getCheckerboardBufferSize()

//         console.log("Result", result);
//         console.log("buffer", bufferPointer);
//         console.log("size", bufferSize);

//         // Pull out the RGBA values from Wasm memory, the we wrote to in wasm,
//         // starting at the checkerboard pointer (memory array index)
//         const imageDataArray = wasmByteMemoryArray.slice(
//             bufferPointer,
//             bufferPointer + bufferSize
//         );

//         // Set the values to the canvas image data
//         canvasImageData.data.set(imageDataArray);

//         // Clear the canvas
//         canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

//         // Place the new generated checkerboard onto the canvas
//         canvasContext.putImageData(canvasImageData, 0, 0);
//     };

//     drawCheckerBoard();
//     setInterval(() => {
//         drawCheckerBoard();
//     }, 1000);
// };
// runWasm();