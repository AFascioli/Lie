const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
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
const asistenciaRoutes = require("./routes/asistencia");
const calificacionesRoutes = require("./routes/calificacion");
const eventoRoutes = require("./routes/evento");
const materiasRoutes = require("./routes/materia");
var Grid = require("gridfs-stream");
let gfs;
//Grid.mongo = mongoose.mongo;

const app = express(); // Creo la app express

const conn = mongoose.createConnection("mongodb://127.0.0.1:27017/icr-local");

conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("imagen");
  console.log("Conexión por imagenes a basede datos local.");
});

app.get("/imagen/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }

    // Check if image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image"
      });
    }
  });
});

// app.use(express.static("backend/images", 'public'));

// Mongodb password: SNcjNuPBMG42lOh1
/* Conectamos a la bd y segun lo que responda ese metodo (la promesa) imprimimos en consola
   lo que corresponda*/

//Conexión a base de producción
//mongoose
// .connect(
//  "mongodb+srv://ComandanteJr:SNcjNuPBMG42lOh1@cluster0-qvosw.mongodb.net/icrdev?retryWrites=true",
//  { useNewUrlParser: true, useUnifiedTopology: true }
//  )
// .then(() => {
//   console.log("Conexión a base de datos de producción exitosa");
//  })
// .catch(() => {
//  console.log("Fallo conexión a la base de datos de producción");
//  });

// //Conexión a base local
mongoose
  .connect("mongodb://127.0.0.1:27017/icr-local", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Conexión a base de datos local exitosa");
  })
  .catch(() => {
    console.log("Fallo conexión a la base de datos local");
  });

// //Para sacar el deprecation warning de la consola
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

app.use("/asistencia", asistenciaRoutes);

app.use("/calificacion", calificacionesRoutes);

app.use("/materia", materiasRoutes);

app.get("/status", (req, res, next) => {
  res.status(200).json({
    message: "Servidor Node.js Lie®"
  });
});

app.use("/evento", eventoRoutes);

module.exports = app;
