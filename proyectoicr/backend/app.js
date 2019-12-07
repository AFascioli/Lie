const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cron = require("node-schedule");
const estudiantesRoutes = require("./routes/estudiante");
const provinciasRoutes = require("./routes/provincia");
const localidadesRoutes = require("./routes/localidad");
const nacionalidadesRoutes = require("./routes/nacionalidad");
const cursoRoutes = require("./routes/curso");
const usuarioRoutes = require("./routes/usuario");
const adultoResponsableRoutes = require("./routes/adultoResponsable");
const empleadoRoutes = require("./routes/empleado");
const cicloLectivoRoutes = require("./routes/cicloLectivo");

const app = express(); // Creo la app express

// Mongodb password: SNcjNuPBMG42lOh1
/* Conectamos a la bd y segun lo que responda ese metodo (la promesa) imprimimos en consola
   lo que corresponda*/

// Conexión a base de producción
mongoose
  .connect(
    "mongodb+srv://ComandanteJr:SNcjNuPBMG42lOh1@cluster0-qvosw.mongodb.net/icrdev?retryWrites=true",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Conexión a base de datos de producción exitosa");
  })
  .catch(() => {
    console.log("Fallo conexión a la base de datos de producción");
  });

// // Conexión a base local
// mongoose.connect('mongodb://127.0.0.1:27017/icr-local',{useNewUrlParser: true, useUnifiedTopology: true  })
// .then(() => {
//   console.log('Conexión a base de datos local exitosa');
// })
// .catch(() => {
//  console.log('Fallo conexión a la base de datos local');
// });

//Para sacar el deprecation warning de la consola
mongoose.set("useFindAndModify", false);

// Usamos el body parser para poder extraer datos del request body
app.use(bodyParser.json());

// Esto se realiza para poder compartir recursos desde otro servidor (servidor angular)
// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Headers"
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

app.use("/curso", cursoRoutes);

app.use("/usuario", usuarioRoutes);

app.use("/adultoResponsable", adultoResponsableRoutes);

app.use("/empleado", empleadoRoutes);

app.use("/cicloLectivo", cicloLectivoRoutes);

// let date = new Date();
// console.log(date);
// console.log("Hora: " + date.getHours());
// console.log("Minuto: " + date.getMinutes());
// console.log("Dia: " + date.getDate());
// console.log("Mes: " + date.getMonth());
// console.log("Año: " + date.getFullYear());

// cron.scheduleJob(
//   {
//     hour: date.getHours(),
//     minute: date.getMinutes()+1,
//     date: date.getDate(),
//     month: date.getMonth(),
//     year: date.getFullYear()
//   },
//   () => {
//     console.log("Se ejecuto la tarea bien");
//   }
// );


module.exports = app;
