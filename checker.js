const importWasmModule = async (wasmModuleUrl) => {
    let importObject = {
        host: {
            print_str: console.log,
            time: Date.now,
        }
    };

    return await WebAssembly.instantiateStreaming(
        fetch(wasmModuleUrl),
        importObject
    );
}

const runWasm = async () => {

    console.log("Loading wasm module");
    // Instantiate our wasm module
    const wasmModule = await importWasmModule("./checker.wasm");

    console.log("Loaded wasm module", wasmModule);

    // Get our exports object, with all of our exported Wasm Properties
    const exports = wasmModule.instance.exports;

    // Get our memory object from the exports
    const memory = exports.memory;

    // Create a Uint8Array to give us access to Wasm Memory
    const wasmByteMemoryArray = new Uint8Array(memory.buffer);

    // Get our canvas element from our index.html
    const canvasElement = document.querySelector("canvas");

    // Set up Context and ImageData on the canvas
    const canvasContext = canvasElement.getContext("2d");
    const canvasImageData = canvasContext.createImageData(
        canvasElement.width,
        canvasElement.height
    );

    // Clear the canvas
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const getDarkValue = () => {
        return Math.floor(Math.random() * 100);
    };

    const getLightValue = () => {
        return Math.floor(Math.random() * 127) + 127;
    };

    const drawCheckerBoard = () => {

        // Generate a new checkboard in wasm
        const result = exports.generateCheckerBoard(
            getDarkValue(),
            getDarkValue(),
            getDarkValue(),
            getLightValue(),
            getLightValue(),
            getLightValue()
        );

        const bufferPointer = exports.getCheckerboardBuffer();
        const bufferSize = exports.getCheckerboardBufferSize()

        console.log("Result", result);
        console.log("buffer", bufferPointer);
        console.log("size", bufferSize);

        // Pull out the RGBA values from Wasm memory, the we wrote to in wasm,
        // starting at the checkerboard pointer (memory array index)
        const imageDataArray = wasmByteMemoryArray.slice(
            bufferPointer,
            bufferPointer + bufferSize
        );

        // Set the values to the canvas image data
        canvasImageData.data.set(imageDataArray);

        // Clear the canvas
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Place the new generated checkerboard onto the canvas
        canvasContext.putImageData(canvasImageData, 0, 0);
    };

    drawCheckerBoard();
    setInterval(() => {
        drawCheckerBoard();
    }, 1000);
};
runWasm();