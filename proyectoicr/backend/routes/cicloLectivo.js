const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const cron = require("node-schedule");
//const CalificacionesXMateria = require("../models/calificacionesXMateria");
//const Curso = require("../models/curso");
const CicloLectivo = require("../models/cicloLectivo");
//const Inscripcion = require("../models/inscripcion");
//const Estudiante = require("../models/estudiante");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseEstado = require("../classes/estado");
//const ClaseEstudiante = require("../classes/estudiante");
//const ClaseSuscripcion = require("../classes/suscripcion");
const ClaseCicloLectivo = require("../classes/cicloLectivo");
const { error } = require("protractor");

router.get("/parametros", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      if (cicloLectivo) {
        res.status(200).json({
          cicloLectivo: cicloLectivo,
          message:
            "Se han obtenido los parámetros correspondientes a este año exitosamente",
          exito: true,
        });
      } else {
        res.status(200).json({
          message:
            "No se han obtenido los parámetros correspondientes a este año",
          exito: false,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los parámetros correspondientes",
        error: error.message,
      });
    });
});

router.post("/parametros", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOneAndUpdate(
    { año: fechaActual.getFullYear() },
    {
      horarioLLegadaTarde: req.body.horaLlegadaTarde,
      horarioRetiroAnticipado: req.body.horaRetiroAnticipado,
      cantidadFaltasSuspension: req.body.cantidadFaltasSuspension,
      cantidadMateriasInscripcionLibre:
        req.body.cantidadMateriasInscripcionLibre,
    }
  )
    .exec()
    .then((cicloLectivo) => {
      res.status(200).json({
        cicloLectivo: cicloLectivo,
        message:
          "Se han guardado los parámetros correspondientes a este año exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un problema al guardar los parámetros",
        error: error.message,
      });
    });
});

router.get("/cantidadFaltasSuspension", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      res.status(200).json({
        faltas: cicloLectivo.cantidadFaltasSuspension,
        message:
          "Se han obtenido la cantidad de faltas para la suspesión exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtenido la cantidad de faltas para la suspesión",
        error: error.message,
      });
    });
});

router.get("/horaLlegadaTarde", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      res.status(200).json({
        hora: cicloLectivo.horarioLLegadaTarde,
        message: "Se han obtenido el horario de llegada tarde exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el horario de llegada tarde",
        error: error.message,
      });
    });
});

router.get("/horaRetiroAnticipado", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      res.status(200).json({
        hora: cicloLectivo.horarioRetiroAnticipado,
        message: "Se han obtenido el horario de retiro anticipado exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el horario de retiro anticipado",
        error: error.message,
      });
    });
});

router.get("/materiasParaLibre", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      res.status(200).json({
        materias: cicloLectivo.cantidadMateriasInscripcionLibre,
        message:
          "Se han obtenido la cantidad de materias para estado Libre exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener la cantidad de materias para estado Libre",
        error: error.message,
      });
    });
});

//Obtiene el estado del ciclo lectivo actual
router.use("/estado", checkAuthMiddleware, (req, res) => {
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
      res.status(500).json({
        error: error.message,
        message: "Ocurrió un error al obtener el estado del ciclo lectivo: ",
      });
    });
});

router.get("/inicioCursado", checkAuthMiddleware, async (req, res) => {
  try {
    // Validar que todas las agendas esten definidas
    let idCreado = await ClaseEstado.obtenerIdEstado("CicloLectivo", "Creado");
    let idEnPrimerTrimestre = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "En primer trimestre"
    );
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
    let cicloProximo = new CicloLectivo({
      horarioLLegadaTarde: 8,
      horarioRetiroAnticipado: 10,
      cantidadFaltasSuspension: 15,
      cantidadMateriasInscripcionLibre: 3,
      año: añoActual + 1,
      estado: idCreado,
    });
    await cicloProximo.save();

    // Crear los cursos del año siguiente
    ClaseCicloLectivo.crearCursosParaCiclo(cicloProximo._id);

    // Actualizar el estado del actual de Creado a En primer trimestre
    CicloLectivo.findOneAndUpdate(
      { año: añoActual, estado: idCreado },
      { estado: idEnPrimerTrimestre }
    ).exec();

    res.status(200).json({
      exito: true,
      message: "Inicio de cursado exitoso.",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Ocurrió un error al querer iniciar el cursado",
    });
  }
});

//En el caso de que se pueda registrar la agenda devuelve true false caso contrario
router.get("/registrarAgenda", checkAuthMiddleware, async (req, res) => {
  let fechaActual = new Date();
  let añoActual = fechaActual.getFullYear();
  try {
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
    ]).then((cicloLectivo) => {
      let nombre = cicloLectivo[0].datosEstado[0].nombre;
      if (nombre === "Creado") {
        return nres.status(200).json({
          permiso: false,
          message: "No esta habilitado el registro de la agenda",
        });
      }

      res.status(200).json({
        permiso: true,
        message: "Está habilitado el registro de la agenda",
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Ocurrieron errores al querer validar los permisos",
    });
  }
});

router.get("/periodoCursado", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  let añoActual = fechaActual.getFullYear();

  try {
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
    ]).then((cicloLectivo) => {
      let nombre = cicloLectivo[0].datosEstado[0].nombre;
      if (
        nombre == "En primer trimestre" ||
        nombre == "En segundo trimestre" ||
        nombre == "En tercer trimestre"
      ) {
        return res.status(200).json({
          permiso: true,
          message: "Está dentro del periodo de cursado",
        });
      }

      res.status(200).json({
        permiso: false,
        message: "No se encuentra dentro del periodo de cursado",
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message:
        "Ocurrió un error al querer determinar si está dentro del periodo de cursado",
    });
  }
});

/*
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
});*/

//#resolve Estos metodos se deberian llamar una vez que se definan las fechas del ciclo lectivo
//en ese endpoint. (fijarse si hace falta mover estos metodos a otro lado, ej, clase CicloLectivo)
/* Al finalizar el tercer trimestre: Se calculan los promedios de los trimestre y se asignan los estados de
acuerdo a si la materia esta aprobada o desaprobada y el promedio final en
caso de aprobada. Tambien se cambia el estado de la inscripcion (Promovido o Examenes pendientes)*/
/*
router.use(
  "/procesoAutomaticoTercerTrimestre",
  checkAuthMiddleware,
  (req, res) => {
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
  }
);

router.use("/procesoAutomaticoFinExamenes", checkAuthMiddleware, (req, res) => {
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

router.get("/inicioCursado", async (req, res) => {
  let idCreado = await ClaseEstado.obtenerIdEstado("CicloLectivo", "Creado");
  let idEnPrimerTrimestre = await ClaseEstado.obtenerIdEstado(
    "CicloLectivo",
    "En primer trimestre"
  );
  let añoActual = new Date().getFullYear();
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
  let cicloProximo = new CicloLectivo({
    horarioLLegadaTarde: 8,
    horarioRetiroAnticipado: 10,
    cantidadFaltasSuspension: 15,
    cantidadMateriasInscripcionLibre: 3,
    año: añoActual + 1,
    estado: idCreado,
  });
  await cicloProximo.save();

  // Crear los cursos del año siguiente
  ClaseCicloLectivo.crearCursosParaCiclo(cicloProximo._id);

  // Actualizar el estado del actual de Creado a En primer trimestre
  CicloLectivo.findOneAndUpdate(
    // { año: añoActual, estado: idCreado },
    { año: 2069, estado: idCreado },
    { estado: idEnPrimerTrimestre }
  ).exec();

  res.status(200).json({
    exito: true,
    message: "Inicio de cursado exitoso.",
  });
});


*/

router.get("/anios", checkAuthMiddleware, (req, res) => {
  CicloLectivo.aggregate([
    {
      $project: {
        _id: 1,
        anio: "$año",
      },
    },
  ])
    .then((anio) => {
      var respuesta = [];
      anio.forEach((anio) => {
        var anios = {
          id: anio._id,
          anio: anio.anio.toString(),
        };
        respuesta.push(anios);
      });
      res.status(200).json({
        respuesta: respuesta,
        message: "Se han obtenido los años de ciclo lectivo",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener los años de ciclo lectivo",
        error: error.message,
      });
    });
});

module.exports = router;
