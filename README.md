My attempt to translate the AssemblyScript example to display a checkboard in a canvas into Onyx

Original example: https://wasmbyexample.dev/examples/reading-and-writing-graphics/reading-and-writing-graphics.assemblyscript.en-us.html#

To run:

```
npm install -g live-server

live-server .
```

Then navigate to http://localhost:8080


To recompile:

Using Onyx 0.19 or higher:

`onyx build checker.onyx -o checker.wasm -r js`

Then run the web server as above.

