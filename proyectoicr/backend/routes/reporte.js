const checkAuthMiddleware = require("../middleware/check-auth");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Inscripcion = require("../models/inscripcion");
const ClaseEstado = require("../classes/estado");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseCicloLectivo = require("../classes/cicloLectivo");

router.get("/documentos", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
  );
  let idEstadoLibre = await ClaseEstado.obtenerIdEstado("Inscripcion", "Libre");

  Inscripcion.aggregate([
    {
      $match: {
        idCurso: mongoose.Types.ObjectId(req.query.idCurso),
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
            mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
            mongoose.Types.ObjectId(idEstadoExPendiente),
            mongoose.Types.ObjectId(idEstadoPromovido),
            mongoose.Types.ObjectId(idEstadoLibre),
          ],
        },
      },
    },
    {
      $unwind: {
        path: "$documentosEntregados",
      },
    },
    {
      $match: {
        "documentosEntregados.entregado": false,
      },
    },
    {
      $lookup: {
        from: "estudiante",
        localField: "idEstudiante",
        foreignField: "_id",
        as: "estudiante",
      },
    },
    {
      $unwind: {
        path: "$estudiante",
      },
    },
    {
      $addFields: {
        estudiante: {
          $concat: ["$estudiante.apellido", ", ", "$estudiante.nombre"],
        },
        documento: "$documentosEntregados.nombre",
      },
    },
    {
      $group: {
        _id: "$idEstudiante",
        nombres: {
          $first: "$estudiante",
        },
        documentos: {
          $push: "$documento",
        },
      },
    },
  ])
    .then((estudiantesXDocs) => {
      if (!estudiantesXDocs) {
        return res.status(200).json({
          exito: true,
          message:
            "No existe ningún estudiante que adeude documentos para este curso",
          estudiantesXDocs: [],
        });
      }
      res.status(200).json({
        exito: true,
        message:
          "Se obtuvieron correctamente los documentos adeudados por este curso",
        estudiantesXDocs: estudiantesXDocs,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener los documentos adeudados",
        error: error.message,
      });
    });
});

router.get("/cuotas", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
  );
  let idEstadoLibre = await ClaseEstado.obtenerIdEstado("Inscripcion", "Libre");

  Inscripcion.aggregate([
    {
      $match: {
        idCurso: mongoose.Types.ObjectId(req.query.idCurso),
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
            mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
            mongoose.Types.ObjectId(idEstadoExPendiente),
            mongoose.Types.ObjectId(idEstadoPromovido),
            mongoose.Types.ObjectId(idEstadoLibre),
          ],
        },
      },
    },
    {
      $unwind: {
        path: "$cuotas",
      },
    },
    {
      $match: {
        "cuotas.pagado": false,
      },
    },
    {
      $lookup: {
        from: "estudiante",
        localField: "idEstudiante",
        foreignField: "_id",
        as: "estudiante",
      },
    },
    {
      $unwind: {
        path: "$estudiante",
      },
    },
    {
      $addFields: {
        estudiante: {
          $concat: ["$estudiante.apellido", ", ", "$estudiante.nombre"],
        },
        documento: "$documentosEntregados.nombre",
      },
    },
    {
      $group: {
        _id: "$idEstudiante",
        mesCuotas: {
          $push: "$cuotas.mes",
        },
        nombres: {
          $first: "$estudiante",
        },
      },
    },
  ])
    .then((estudiantesXCuotas) => {
      if (!estudiantesXCuotas) {
        return res.status(200).json({
          exito: true,
          message:
            "No existe ningún estudiante que adeude cuotas en este curso",
          estudiantesXCuotas: [],
        });
      }
      res.status(200).json({
        exito: true,
        message:
          "Se obtuvieron correctamente las cuotas adeudadas por este curso",
        estudiantesXCuotas: estudiantesXCuotas,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener las cuotas adeudados",
        error: error.message,
      });
    });
});

router.get("/resumenAcademico", checkAuthMiddleware, async (req, res) => {

  let idCicloSeleccionado = await ClaseCicloLectivo.getIdCicloLectivo(req.query.cicloSeleccionado)
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        cicloLectivo: mongoose.Types.ObjectId(idCicloSeleccionado)
      },
    },
    {
      $unwind: {
        path: "$calificacionesXMateria",
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "calificacionesXMateriaDif",
      },
    },
    {
      $group: {
        _id: "$calificacionesXMateriaDif._id",
        idInscipcion: {
          $first: "$_id",
        },
        idEstudiante: {
          $first: "$idEstudiante",
        },
        calificacionesXTrimestre: {
          $push: {
            $arrayElemAt: [
              "$calificacionesXMateriaDif.calificacionesXTrimestre",
              0,
            ],
          },
        },
        materia: {
          $first: "$calificacionesXMateriaDif.idMateria",
        },
        sanciones: {
          $first: "$sanciones",
        },
        contadorInasistenciasInjustificada: {
          $first: "$contadorInasistenciasInjustificada",
        },
        contadorInasistenciasJustificada: {
          $first: "$contadorInasistenciasJustificada",
        },
        promedio: {
          $first: "$calificacionesXMateriaDif.promedio",
        },
        estadoMXC: {
          $first: "$calificacionesXMateriaDif.estado",
        },
      },
    },
    {
      $unwind: {
        path: "$calificacionesXTrimestre",
      },
    },
    {
      $unwind: {
        path: "$calificacionesXTrimestre",
      },
    },
    {
      $lookup: {
        from: "calificacionesXTrimestre",
        localField: "calificacionesXTrimestre",
        foreignField: "_id",
        as: "calificacionesTrim",
      },
    },
    {
      $group: {
        _id: "$calificacionesTrim._id",
        idMateriaXCalif: {
          $first: "$_id",
        },
        idEstudiante: {
          $first: "$idEstudiante",
        },
        calificaciones: {
          $first: "$calificacionesTrim.calificaciones",
        },
        trim: {
          $first: "$calificacionesTrim.trimestre",
        },
        materia: {
          $first: "$materia",
        },
        sanciones: {
          $first: "$sanciones",
        },
        contadorInasistenciasInjustificada: {
          $first: "$contadorInasistenciasInjustificada",
        },
        contadorInasistenciasJustificada: {
          $first: "$contadorInasistenciasJustificada",
        },
        promedio: {
          $first: "$promedio",
        },
        estadoMXC: {
          $first: "$estadoMXC",
        },
      },
    },
    {
      $group: {
        _id: "$idMateriaXCalif",
        idEstudiante: {
          $first: "$idEstudiante",
        },
        calificaciones: {
          $push: "$calificaciones",
        },
        trimestre: {
          $push: "$trim",
        },
        materia: {
          $first: "$materia",
        },
        sanciones: {
          $first: "$sanciones",
        },
        contadorInasistenciasInjustificada: {
          $first: "$contadorInasistenciasInjustificada",
        },
        contadorInasistenciasJustificada: {
          $first: "$contadorInasistenciasJustificada",
        },
        promedio: {
          $first: "$promedio",
        },
        estadoMXC: {
          $first: "$estadoMXC",
        },
      },
    },
    {
      $lookup: {
        from: "estudiante",
        localField: "idEstudiante",
        foreignField: "_id",
        as: "Estudiante",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "materia",
        foreignField: "_id",
        as: "materia",
      },
    },
    {
      $project: {
        idEstudiante: 1,
        calificaciones: 1,
        trimestre: 1,
        nombre: {
          $arrayElemAt: ["$Estudiante.nombre", 0],
        },
        apellido: {
          $arrayElemAt: ["$Estudiante.apellido", 0],
        },
        tipoDoc: {
          $arrayElemAt: ["$Estudiante.tipoDocumento", 0],
        },
        nroDoc: {
          $arrayElemAt: ["$Estudiante.numeroDocumento", 0],
        },
        Materia: {
          $arrayElemAt: ["$materia.nombre", 0],
        },
        sanciones: 1,
        promedio: 1,
        contadorInasistenciasInjustificada: 1,
        contadorInasistenciasJustificada: 1,
        estadoMXC: 1,
      },
    },
  ])
    .then(async (resumen) => {
      if (resumen) {
        let aprobConExamen = await ClaseEstado.obtenerIdEstado(
          "CalificacionesXMateria",
          "AprobadaConExamen"
        );

        for (const materia of resumen) {
          if (
            materia.estadoMXC[0]
              .toString()
              .localeCompare(aprobConExamen.toString()) == 0
          ) {
            materia.aprobadaConExamen = true;
          } else {
            materia.aprobadaConExamen = false;
          }
        }

        return res.status(200).json({
          exito: true,
          message:
            "Se obtuvo correctamente el resumen académico del estudiante",
          resumen: resumen,
        });
      }
      return res.status(200).json({
        exito: true,
        message: "No se obtuvieron resultados",
        resumen: [],
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al obtener el resumen académico del estudiante",
        error: error.message,
      });
    });
});

//Retorna un array con cursos, donde cada uno tiene su promedio general, sus materias y sus respectivos promedios
router.get("/cursos/promedios", async (req, res) => {
  try {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido con examenes pendientes"
    );
    let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Examenes pendientes"
    );
    let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido"
    );
    let idEstadoLibre = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Libre"
    );
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
    // let idCicloActual = "60206236bfaa2d1d007c9e92";//icr-test: Id de ciclo que tiene materias

    let inscripcionesTotales = await Inscripcion.aggregate([
      {
        $match: {
          cicloLectivo: mongoose.Types.ObjectId(idCicloActual),
          estado: {
            $in: [
              mongoose.Types.ObjectId(idEstadoActiva),
              mongoose.Types.ObjectId(idEstadoSuspendido),
              mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
              mongoose.Types.ObjectId(idEstadoExPendiente),
              mongoose.Types.ObjectId(idEstadoPromovido),
              mongoose.Types.ObjectId(idEstadoLibre),
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
        $lookup: {
          from: "materia",
          localField: "datosCXM.idMateria",
          foreignField: "_id",
          as: "datosMateria",
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
        $lookup: {
          from: "curso",
          localField: "idCurso",
          foreignField: "_id",
          as: "datosCurso",
        },
      },
    ]);
    let arrayCursos = [];

    //Recorrer inscripciones del ciclo actual
    for (const inscripcion of inscripcionesTotales) {
      let nombreCursoInsc = inscripcion.datosCurso[0].nombre;
      let nombreMateriaInsc = inscripcion.datosMateria[0].nombre;
      let cursoPerteneciente = null;
      for (const curso of arrayCursos) {
        if (
          curso.nombreCurso
            .toString()
            .localeCompare(nombreCursoInsc.toString()) == 0
        ) {
          cursoPerteneciente = curso;
        }
      }
      //Si ya esta en el array arrayCursos el curso de la inscripcion
      if (cursoPerteneciente) {
        let promedioT1 = ClaseCXM.obtenerPromedioDeTrimestre(
          inscripcion.datosCXT[0].calificaciones
        );
        let promedioT2 = ClaseCXM.obtenerPromedioDeTrimestre(
          inscripcion.datosCXT[1].calificaciones
        );
        let promedioT3 = ClaseCXM.obtenerPromedioDeTrimestre(
          inscripcion.datosCXT[2].calificaciones
        );
        let total = 0;
        let cantPromedios = 0;
        if (promedioT1 != 0) {
          (total += promedioT1), cantPromedios++;
        }
        if (promedioT2 != 0) {
          (total += promedioT2), cantPromedios++;
        }
        if (promedioT3 != 0) {
          (total += promedioT3), cantPromedios++;
        }
        let seAgregoMateria = false;
        //Recorrer cada materia del curso
        for (const materia of cursoPerteneciente.materias) {
          //Si existe esa materia en ese curso, se agrega un promedio nuevo
          if (
            materia.nombreMateria
              .toString()
              .localeCompare(nombreMateriaInsc.toString()) == 0
          ) {
            seAgregoMateria = true;
            materia.promedios.push(total / cantPromedios);
          }
        }
        //Si no existe esa materia en ese curso, la materia con el primer promedio
        if (!seAgregoMateria) {
          //Agregar al array
          cursoPerteneciente.materias.push({
            nombreMateria: nombreMateriaInsc,
            promedios: [total / cantPromedios],
          });
        }
      } else {
        //Esto pasa si en el array arrayCursos no existe entrada para el curso
        let promedioT1 = ClaseCXM.obtenerPromedioDeTrimestre(
          inscripcion.datosCXT[0].calificaciones
        );
        let promedioT2 = ClaseCXM.obtenerPromedioDeTrimestre(
          inscripcion.datosCXT[1].calificaciones
        );
        let promedioT3 = ClaseCXM.obtenerPromedioDeTrimestre(
          inscripcion.datosCXT[2].calificaciones
        );
        let total = 0;
        let cantPromedios = 0;
        if (promedioT1 != 0) {
          (total += promedioT1), cantPromedios++;
        }
        if (promedioT2 != 0) {
          (total += promedioT2), cantPromedios++;
        }
        if (promedioT3 != 0) {
          (total += promedioT3), cantPromedios++;
        }

        arrayCursos.push({
          nombreCurso: nombreCursoInsc,
          materias: [
            {
              nombreMateria: nombreMateriaInsc,
              promedios: [total / cantPromedios],
            },
          ],
        });
      }
      cursoPerteneciente = null;
    }

    for (const curso of arrayCursos) {
      //Al final del loop de abajo se obtiene el promedio de cada una de las materias
      for (const materia of curso.materias) {
        let total = materia.promedios.reduce((total, promedio) => {
          return total + promedio;
        }, 0);
        materia.promedioMateria = parseFloat(
          (total / materia.promedios.length).toFixed(2)
        );
        delete materia.promedios;
      }

      //Una vez calculado el promedio de las materias, se calcula el promedio del curso
      let totalCurso = curso.materias.reduce((total, materia) => {
        return total + materia.promedioMateria;
      }, 0);
      curso.promedioGral = parseFloat(
        (totalCurso / curso.materias.length).toFixed(2)
      );
    }

    res.status(200).json({
      exito: true,
      message: "Se obtuvo correctamente el promedio general de cada curso",
      arrayCursos: arrayCursos,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Ocurrió un error al obtener el promedio general de cada curso",
      error: error,
    });
  }
});

module.exports = router;
