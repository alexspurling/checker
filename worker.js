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
}


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


let fps = 0;
let numFrames = 0;
let lastFpsTime = 0;


function render() {
    // Generate a new checkboard in wasm

    let startTime = Date.now();
    exports.render(BigInt(Date.now()));
    const renderTime = Date.now() - startTime;

    startTime = Date.now();
    const imageDataArray = wasmByteMemoryArray.slice(
        bufferPointer,
        bufferPointer + bufferSize
    );

    // console.log(wasmByteMemoryArray);

    // Get our canvas element from our index.html
    // const canvasElement = document.querySelector("canvas");

    // Set up Context and ImageData on the canvas
    const ctx = canvas.getContext("2d");
    const canvasImageData = ctx.createImageData(
        canvas.width,
        canvas.height
    );
    canvasImageData.data.set(imageDataArray);
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(canvasImageData, 0, 0);

    const updateTime = Date.now() - startTime;

    // Render the FPS counter
    renderFPS(ctx);

    // requestAnimationFrame(render);
    // console.log("Render time", renderTime, "Slice time", sliceTime, "createImageDataTime", createImageDataTime, "setImageDataTime", setImageDataTime, "clearRectTime", clearRectTime, "putImageDataTime", putImageDataTime);
    console.log("Render time", renderTime, "Update time", updateTime);
}

function renderFPS(ctx) {
    const curTime = Date.now();
    if (curTime - lastFpsTime >= 1000) {
        lastFpsTime = curTime;
        fps = numFrames;
        numFrames = 0;
    }

    numFrames += 1;

    ctx.font = "20px sans";
    ctx.fillStyle = "black";
    ctx.fillText("FPS: " + fps, 20, 40);
}
