const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const cron = require("node-schedule");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const CicloLectivo = require("../models/cicloLectivo");
const Inscripcion = require("../models/inscripcion");
const Estado = require("../models/estado");
const Estudiante = require("../models/estudiante");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseEstado = require("../classes/estado");
const ClaseEstudiante = require("../classes/estudiante");
const ClaseSuscripcion = require("../classes/suscripcion");
const Curso = require("../models/curso");
const ClaseCicloLectivo = require("../classes/cicloLectivo");

router.get("/", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      if (cicloLectivo) {
        res.status(200).json({
          cicloLectivo: cicloLectivo,
          message:
            "Se han obtenido las fechas correspondientes a este año exitosamente",
          exito: true,
        });
      } else {
        res.status(200).json({
          message: "No se han obtenido las fechas correspondientes a este año",
          exito: false,
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//#resolve Estos metodos se deberian llamar una vez que se definan las fechas del ciclo lectivo
//en ese endpoint. (fijarse si hace falta mover estos metodos a otro lado, ej, clase CicloLectivo)
/* Al finalizar el tercer trimestre: Se calculan los promedios de los trimestre y se asignan los estados de
acuerdo a si la materia esta aprobada o desaprobada y el promedio final en
caso de aprobada. Tambien se cambia el estado de la inscripcion (Promovido o Examenes pendientes)*/
router.use("/procesoAutomaticoTercerTrimestre", (req, res) => {
  let date = new Date();
  let fechas;
  CicloLectivo.findOne({ año: date.getFullYear() })
    .then((cicloLectivoActual) => {
      //Se agrega +1 en date porque devuelve mal el dia.
      fechas = new Date(
        cicloLectivoActual.fechaFinTercerTrimestre.getFullYear(),
        cicloLectivoActual.fechaFinTercerTrimestre.getMonth(),
        cicloLectivoActual.fechaFinTercerTrimestre.getDate() + 1,
        20,
        0,
        0
      );
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });

  let obtenerTodasCXM = (año) => {
    return new Promise((resolve, reject) => {
      Inscripcion.aggregate([
        {
          $match: {
            activa: true,
            año: año,
          },
        },
        {
          $lookup: {
            from: "calificacionesXMateria",
            localField: "calificacionesXMateria",
            foreignField: "_id",
            as: "CXM",
          },
        },
        {
          $project: {
            CXM: 1,
            materiasPendientes: 1,
          },
        },
        {
          $unwind: {
            path: "$CXM",
          },
        },
        {
          $lookup: {
            from: "calificacionesXTrimestre",
            localField: "CXM.calificacionesXTrimestre",
            foreignField: "_id",
            as: "CXT",
          },
        },
      ])
        .then((cxmTotales) => {
          resolve(cxmTotales);
        })
        .catch(() => {
          reject({ message: "Mensaje de error especifico" });
        });
    });
  };

  let obtenerTodasInscripcionesConCXM = () => {
    return new Promise((resolve, reject) => {
      Inscripcion.find({ activa: true })
        .then((inscripciones) => {
          resolve(inscripciones);
        })
        .catch(() => {
          reject("Error");
        });
    });
  };

  let obtenerCXM = (id) => {
    return new Promise((resolve, reject) => {
      CalificacionesXMateria.findById(id)
        .then((cxmEncontrada) => {
          resolve(cxmEncontrada);
        })
        .catch(() => {
          reject({ message: "Mensaje de error especifico" });
        });
    });
  };

  cron.scheduleJob(
    fechas,
    // date.setSeconds(date.getSeconds() + 5),
    async () => {
      let cxmTotales = await obtenerTodasCXM(2020);
      for (let materia of cxmTotales) {
        let cxmEncontrada = await obtenerCXM(materia.CXM._id);
        let resultadoFinal = ClaseCXM.obtenerEstadoYPromedioCXM(
          materia.CXT[0].calificaciones,
          materia.CXT[1].calificaciones,
          materia.CXT[2].calificaciones
        );

        if (resultadoFinal.aprobado) {
          let idEstado = await ClaseEstado.obtenerIdEstado(
            "CalificacionesXMateria",
            "Aprobada"
          );
          cxmEncontrada.estado = idEstado;
        } else {
          let idEstado = await ClaseEstado.obtenerIdEstado(
            "CalificacionesXMateria",
            "Desaprobada"
          );
          cxmEncontrada.estado = idEstado;
        }
        cxmEncontrada.promedio = resultadoFinal.promedio;
        cxmEncontrada.save();
      }

      let inscripcionesConCXM = await obtenerTodasInscripcionesConCXM();
      let idEstadoCXM = await ClaseEstado.obtenerIdEstado(
        "CalificacionesXMateria",
        "Desaprobada"
      );
      let contadorMateriasDesaprobadas = 0;
      let idEstadoInscripcion;
      for (let inscripcion of inscripcionesConCXM) {
        let arrayCXMDesaprobadas = await ClaseCXM.obtenerMateriasDesaprobadasv2(
          inscripcion.materiasPendientes,
          inscripcion.calificacionesXMateria,
          idEstadoCXM
        );
        contadorMateriasDesaprobadas = arrayCXMDesaprobadas.length;
        let textoNotificacion = "";
        if (contadorMateriasDesaprobadas > 3) {
          idEstadoInscripcion = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Examenes pendientes"
          );
          textoNotificacion = " debe rendir materias";
        } else {
          idEstadoInscripcion = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Promovido"
          );
          textoNotificacion = " fue promovido";
        }
        contadorMateriasDesaprobadas = 0;
        Inscripcion.findByIdAndUpdate(inscripcion._id, {
          estado: idEstadoInscripcion,
        })
          .then(async () => {
            let idsUsuarios = await ClaseSuscripcion.obtenerIdsUsuarios(
              inscripcion.idEstudiante
            );
            if (idsUsuarios.length > 0) {
              let datosEstudiante = ClaseEstudiante.obtenerNombreYApellido(
                inscripcion.idEstudiante
              );
              ClaseSuscripcion.notificacionGrupal(
                idsUsuarios,
                "Cierre ciclo lectivo",
                `El estudiante ${datosEstudiante.nombre} ${datosEstudiante.apellido} ${textoNotificacion}`
              );
            }
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico",
            });
          });
      }
    }
  );
  next();
});

/* Al cumplirse la fecha de fin de examenes: El metodo siguiente se fija la cantidad de
materias desaprobadas del año lectivo y la cantidad de materias pendientes y de acuerdo a
eso le cambia el estado a la inscripcion */
router.use("/procesoAutomaticoFinExamenes", (req, res) => {
  // let fechaActual = new Date();
  let fechaFinExamenes;
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivoActual) => {
      //Se agrega +1 en date porque devuelve mal el dia.
      fechaFinExamenes = new Date(
        cicloLectivoActual.fechaFinTercerTrimestre.getFullYear(),
        cicloLectivoActual.fechaFinTercerTrimestre.getMonth(),
        cicloLectivoActual.fechaFinTercerTrimestre.getDate() + 1,
        20,
        0,
        0
      );
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });

  cron.scheduleJob(
    // fechaActual.setSeconds(fechaActual.getSeconds() + 5),
    fechaFinExamenes,
    async () => {
      Curso.find().then((cursos) => {
        cursos.forEach((curso) => {
          curso.capacidad = 30;
          curso.save();
        });
      });
      let obtenerInscripcionesActivas = () => {
        return new Promise((resolve, reject) => {
          Inscripcion.find({ activa: true })
            .then((inscripciones) => {
              resolve(inscripciones);
            })
            .catch(() => {
              reject("Error");
            });
        });
      };
      let idEstadoInscripcion;
      let contadorMateriasDesaprobadas = 0;
      let materiasDeInscripcion = await obtenerInscripcionesActivas();
      let idEstadoCXM = await ClaseEstado.obtenerIdEstado(
        "CalificacionesXMateria",
        "Desaprobada"
      );

      for (const inscripcion of materiasDeInscripcion) {
        let arrayCXMDesaprobadas = await ClaseCXM.obtenerMateriasDesaprobadasv2(
          inscripcion.materiasPendientes,
          inscripcion.calificacionesXMateria,
          idEstadoCXM
        );
        contadorMateriasDesaprobadas = arrayCXMDesaprobadas.length;

        if (contadorMateriasDesaprobadas > 3) {
          idEstadoInscripcion = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Libre"
          );
        } else if (contadorMateriasDesaprobadas == 0) {
          idEstadoInscripcion = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Promovido"
          );
        } else {
          idEstadoInscripcion = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Promovido con examenes pendientes"
          );
        }
        contadorMateriasDesaprobadas = 0;
        await Inscripcion.findByIdAndUpdate(inscripcion._id, {
          estado: idEstadoInscripcion,
        }).then(async () => {
          let idEstadoEstudiante = await ClaseEstado.obtenerIdEstado(
            "Estudiante",
            "Pendiente de inscripcion"
          );
          Estudiante.findByIdAndUpdate(inscripcion.idEstudiante, {
            estado: idEstadoEstudiante,
          }).exec();
        });
      }
    }
  );
});

//Obtiene el estado del ciclo lectivo actual
router.use("/estado", (req, res) => {
  let añoActual = new Date().getFullYear();
  CicloLectivo.aggregate([
    {
      $match: {
        año: añoActual,
      },
    },
    {
      $lookup: {
        from: "estado",
        localField: "estado",
        foreignField: "_id",
        as: "datosEstado",
      },
    },
  ])
    .then((cicloLectivo) => {
      res.status(200).json({
        exito: true,
        message: "Estado encontrado exitosamente",
        estadoCiclo: cicloLectivo[0].datosEstado[0].nombre,
      });
    })
    .catch((error) => {
      res.status(400).json({
        exito: false,
        message:
          "Ocurrió un error al obtener el estado del ciclo lectivo: " +
          error.message,
      });
    });
});

router.get("/cicloLectivo/inicioCursado", async (req, res) => {
  // Validar que todas las agendas esten definidas
  let resultado = await ClaseCicloLectivo.cursosTienenAgenda();

  if (resultado.length != 0) {
    let mensaje =
      "Los siguientes cursos no tienen la agenda de cursado definida: ";

    resultado.map((curso) => {
      mensaje += curso.nombre + "; ";
    });

    mensaje = mensaje.slice(0, mensaje.length - 2);

    return res.status(200).json({
      cursosSinAgenda: resultado,
      exito: false,
      message: mensaje,
    });
  }

  // Pasar las inscripciones pendientes a activas (con todo lo que implica)
  let cambioInscripciones = await ClaseCicloLectivo.pasarInscripcionesAActivas();

  // Crear el proximo ciclo lectivo
  // Crear los cursos del año siguiente
  // Actualizar el estado del actual de Creado a En primer trimestre

  res.status(200).json({
    exito: true,
    message: resultado,
  });
});

module.exports = router;
