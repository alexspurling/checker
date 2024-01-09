console.log("Running worker");

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

const onyx_kill_thread = (o) => {
    console.log("Solver worker kill thread", o);
}

const importWasmModule = async (memory, wasmModuleUrl) => {
    let importObject = {
        host: {
            print_str: onyx_print_str,
            time: Date.now,
            kill_thread: onyx_kill_thread
        },
        onyx: {
            memory: memory
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


const loadWasm = async (memory) => {
    console.log("Loading wasm module");
    wasmModule = await importWasmModule(memory, "./day17.wasm");
    console.log("Loaded wasm module", wasmModule);

    // Initialise the Onyx runtime - this is needed to set up heap space and other things
    wasmModule.instance.exports._initialize();
    wasmInstance = wasmModule.instance;
    console.log("Got wasm instance: ", wasmInstance);

    bufferPointer = wasmInstance.exports.getBufferPointer();
    bufferSize = wasmInstance.exports.getBufferSize();

    console.log("Got buffer pointer and size", bufferPointer, bufferSize);

    exports = wasmInstance.exports;
    memory = exports.memory;
    wasmByteMemoryArray = new Uint8Array(memory.buffer);
}


onmessage = async (e) => {
    if (e.data.msg == "load") {
        let memory = e.data.params[0];
        await loadWasm(memory);
        postMessage({msg: "loaded"});
    } else if (e.data.msg == "solve") {
        solvewasm();
    } else {
        console.log("Received unknown message", e.data);
    }
};


function solvewasm() {
    let startTime = Date.now();
    let ret = exports.step();
    const solveTime = Date.now() - startTime;
    console.log("Solve time:", solveTime, "ret", ret);
}