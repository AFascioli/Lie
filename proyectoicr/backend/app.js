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
const reporteRoutes = require("./routes/reporte");
const Ambiente = require("./assets/ambiente");
var Grid = require("gridfs-stream");

const app = express();
options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

//Conexion a la base de datos
mongoose
  .connect(Ambiente.stringDeConexion, options)
  .then(() => {
    console.log("Conexión a base de datos exitosa");
    console.log(Ambiente.stringDeConexion);
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
  console.log("Conexión por imagenes a base de datos");
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

app.use("/reporte", reporteRoutes);

app.get("/status", (req, res, next) => {
  return res.status(200).json({
    message: "Servidor Node.js Lie® 4/3/2021",
  });
});

const ClaseSuscripcion = require("./classes/suscripcion");

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

const ClaseCicloLectivo = require("./classes/cicloLectivo");
const ClaseEstado = require("./classes/estado");
const Inscripcion = require("./models/inscripcion");
const MateriasXCurso = require("./models/materiasXCurso");
const CalificacionesXMateria = require("./models/calificacionesXMateria");
const ClaseCalificacionesXMateria = require("./classes/calificacionXMateria");
app.get("/testi", async (req, res, next) => {
  // let idEstudiante = "";
  // let idCicloActual = await this.obtenerIdCicloActual();
  // let idPromovido = await ClaseEstado.obtenerIdEstado(
  //   "Inscripcion",
  //   "Promovido"
  // );
  // let idExamenesPendientes = await ClaseEstado.obtenerIdEstado(
  //   "Inscripcion",
  //   "Promovido con examenes pendientes"
  // );
  // let idEstadoCXMDesaprobada = await ClaseEstado.obtenerIdEstado(
  //   "CalificacionesXMateria",
  //   "Desaprobada"
  // );

  // let inscripcionAnterior = await Inscripcion.findOne({
  //   idEstudiante: inscripcion.idEstudiante,
  //   estado: {
  //     $in: [idPromovido, idExamenesPendientes],
  //   },
  //   cicloLectivo: idCicloActual,
  // });

  // inscripcion.calificacionesXMateria = idsCXM;
  // //Obtenemos las materias pendientes del estudiante
  // let materiasPendientes = [];
  // if (inscripcionAnterior) {
  //   materiasPendientes = await ClaseCalificacionesXMateria.obtenerMateriasDesaprobadasv2(
  //     inscripcionAnterior.materiasPendientes,
  //     inscripcionAnterior.calificacionesXMateria,
  //     idEstadoCXMDesaprobada
  //   );
  // }
  // inscripcion.materiasPendientes = materiasPendientes;
  // inscripcion.save();

  const idEstadoCXMPendiente = await ClaseEstado.obtenerIdEstado(
    "CalificacionesXMateria",
    "Pendiente examen"
  );
  const idEstadoCXMDesaprobada = await ClaseEstado.obtenerIdEstado(
    "CalificacionesXMateria",
    "Desaprobada"
  );

  let idsCXMPendientes = [];

  let inscripcionesPendientes = await Inscripcion.aggregate([
    {
      $match: {
        cicloLectivo: mongoose.Types.ObjectId("5fea5b787678e028fc7023cf"),
        idEstudiante: mongoose.Types.ObjectId("5fd93e7e40fb9f06845c23a9"),
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "datosCXM",
      },
    },
  ]);

  for (const inscripcion of inscripcionesPendientes) {
    for (const cxm of inscripcion.datosCXM) {
      if (
        cxm.estado.toString().localeCompare(idEstadoCXMPendiente.toString()) ==
        0
      ) {
        idsCXMPendientes.push(cxm._id);
      }
    }
  }

  for (const idCxm of idsCXMPendientes) {
    await CalificacionesXMateria.findByIdAndUpdate(idCxm, {
      estado: idEstadoCXMDesaprobada,
    }).exec();
  }

  res.status(200).json({
    message: idsCXMPendientes,
  });
});

module.exports = app;
