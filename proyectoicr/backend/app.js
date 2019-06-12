const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const estudiantesRoutes = require("./routes/estudiante");
const provinciasRoutes = require("./routes/provincia");
const localidadesRoutes = require("./routes/localidad");
const nacionalidadesRoutes = require("./routes/nacionalidad");

const app = express(); // Creo la app express

// Mongodb password: SNcjNuPBMG42lOh1
/* Conectamos a la bd y segun lo que responda ese metodo (la promesa) imprimimos en consola
   lo que corresponda*/
mongoose.connect('mongodb+srv://ComandanteJr:SNcjNuPBMG42lOh1@cluster0-qvosw.mongodb.net/icrdev?retryWrites=true')
.then(() => {
  console.log('Conexion a la BD exitosa');
})
.catch(() => {
  console.log('Conexion a la bd faliida');
});

// Usamos el body parser para poder extraer datos del request body
app.use(bodyParser.json());

// Esto se realiza para poder compartir recursos desde otro servidor (servidor angular)
// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

app.use("/estudiante", estudiantesRoutes);

app.use("/provincia", provinciasRoutes);

app.use("/localidad", localidadesRoutes);

app.use("/nacionalidad", nacionalidadesRoutes);

module.exports = app;
