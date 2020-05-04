const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const estudiantesRoutes = require("./routes/estudiante");
const ubicacionRoutes = require("./routes/ubicacion");
const cursoRoutes = require("./routes/curso");
const usuarioRoutes = require("./routes/usuario");
const adultoResponsableRoutes = require("./routes/adultoResponsable");
const empleadoRoutes = require("./routes/empleado");
const cicloLectivoRoutes = require("./routes/cicloLectivo");
const asistenciaRoutes = require("./routes/asistencia");
const calificacionesRoutes = require("./routes/calificacion");
const eventoRoutes = require("./routes/evento");
const materiasRoutes = require("./routes/materia");
const Ambiente = require("./assets/ambiente");
var Grid = require("gridfs-stream");

const app = express();
options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

mongoose
  .connect(Ambiente.stringDeConexion, options)
  .then(() => {
    console.log("Conexión a base de datos exitosa");
  })
  .catch(() => {
    console.log("Fallo conexión a la base de datos");
  });

// Conexión a la base de datos que se usa en paralelo para manejo de imagenes
const conn = mongoose.createConnection(Ambiente.stringDeConexion, options);
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("imagen");
  console.log("Conexión por imagenes a base de datos local");
});

app.get("/imagen/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }

    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image",
      });
    }
  });
});

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

// app.get("/imagen/:filename", (req, res) => {
//   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//     // Check if file
//     if (!file || file.length === 0) {
//       return res.status(404).json({
//         err: "No file exists",
//       });
//     }

//     // Check if image
//     if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
//       // Read output to browser
//       const readstream = gfs.createReadStream(file.filename);
//       readstream.pipe(res);
//     } else {
//       res.status(404).json({
//         err: "Not an image",
//       });
//     }
//   });
// });

app.use("/estudiante", estudiantesRoutes);

app.use("/ubicacion", ubicacionRoutes);

app.use("/curso", cursoRoutes);

app.use("/usuario", usuarioRoutes);

app.use("/adultoResponsable", adultoResponsableRoutes);

app.use("/empleado", empleadoRoutes);

app.use("/cicloLectivo", cicloLectivoRoutes);

app.use("/asistencia", asistenciaRoutes);

app.use("/calificacion", calificacionesRoutes);

app.use("/materia", materiasRoutes);

app.use("/evento", eventoRoutes);

app.get("/status", (req, res, next) => {
  res.status(200).json({
    message: "Servidor Node.js Lie®",
  });
});

// #resolve Guardar comentarios y diccionario
// Endpoint save diccionario
var mimir = require("mimir");
var file_apropiados = require("./assets/comentarios_apropiados");
var file_inapropiados = require("./assets/comentarios_inapropiados");
var comentarios_apropiados = file_apropiados.comentarios_apropiados;
var comentarios_inapropiados = file_inapropiados.comentarios_inapropiados;
var comentarios = comentarios_apropiados.concat(comentarios_inapropiados);
const Diccionario = require("./models/diccionario");
// #wip Por ahora llena de vuelta con los archivos nomas
app.get("/sdict", (res) => {
  let diccionario = mimir.dict(comentarios);

  const dict = new Diccionario({
    comentarios_apropiados: comentarios_apropiados,
    comentarios_inapropiados: comentarios_inapropiados,
    diccionario: diccionario,
  });

  dict.save().then(() => {
    res.status(200).json({
      message: "Diccionario creado.",
    });
  });
});

module.exports = app;
