const app = require("./app");
const http = require("http");
const debug = require("debug")("node-angular");
const port = "3000";

// Creo el servidor y le mando la app que va a correr en él
const server = http.createServer(app);

//Asigno el puerto en el que va a escuchar el servidor
server.listen(port);
console.log(`El servidor esta andando correctamente en el puerto ${port}`)
