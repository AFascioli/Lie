const mongoose = require("mongoose");
const Inscripcion = require("../models/inscripcion");
const ClaseCicloLectivo = require("../classes/cicloLectivo");
const ClaseEstado = require("../classes/estado");

//Retorna un booleano segun se pueda cerrar la materia. Se puede cerrar si todos los estudiantes
//tienen al menos 3 notas registradas
exports.sePuedeCerrarMateria = (idMateria, idCurso, trimestre) => {
  return new Promise(async (resolve, reject) => {
    const idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
    const idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    const idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );

    const inscripcionesFiltradas = await Inscripcion.aggregate([
      {
        $match: {
          idCurso: mongoose.Types.ObjectId(idCurso),
          cicloLectivo: mongoose.Types.ObjectId(idCicloActual),
          estado: {
            $in: [
              mongoose.Types.ObjectId(idEstadoActiva),
              mongoose.Types.ObjectId(idEstadoSuspendido),
            ],
          },
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
      {
        $unwind: {
          path: "$datosCXM",
        },
      },
      {
        $match: {
          "datosCXM.idMateria": mongoose.Types.ObjectId(idMateria),
        },
      },
      {
        $lookup: {
          from: "calificacionesXTrimestre",
          localField: "datosCXM.calificacionesXTrimestre",
          foreignField: "_id",
          as: "datosCXT",
        },
      },
      {
        $project: {
          "datosCXT.calificaciones": 1,
        },
      },
    ]);

    for (const inscripcion of inscripcionesFiltradas) {
      const calificacionesInscripcion =
        inscripcion.datosCXT[trimestre - 1].calificaciones;
      let arrayCantidadConNotas = calificacionesInscripcion.filter(
        (calificacion) => {
          return calificacion != 0;
        }
      );

      if (!(arrayCantidadConNotas.length >= 3)) {
        resolve(false);
      }
    }
    resolve(true);
  });
};
