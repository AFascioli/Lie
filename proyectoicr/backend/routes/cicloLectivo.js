const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");
const cron = require("node-schedule");
const Inscripcion = require("../models/inscripcion");
const Estado = require("../models/estado");
const Estudiante = require("../models/estudiante");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseEstado = require("../classes/estado");
const CalificacionesXMateria = require("../models/calificacionesXMateria");

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

/* Al finalizar el tercer trimestre: Se calculan los promedios de los trimestre y se asignan los estados de
acuerdo a si la materia esta aprobada o desaprobada y el promedio final en
caso de aprobada. Tambien se cambia el estado de la inscripcion (Promovido o Examenes pendientes)*/
router.get("/procesoAutomaticoTercerTrimestre", (req, res) => {
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
      Inscripcion.aggregate([
        {
          $match: {
            activa: true,
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
            materiasPendientes: 1,
            CXM: 1,
          },
        },
      ])
        .then((materiasDesaprobadasTotales) => {
          resolve(materiasDesaprobadasTotales);
        })
        .catch(() => {
          reject({ message: "Mensaje de error especifico" });
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
    //  fechas,
    date.setSeconds(date.getSeconds() + 5),
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
      let contadorMateriasDesaprobadas = 0;
      let idEstado;
      for (let inscripcion of inscripcionesConCXM) {
        for (let materia of inscripcion.CXM) {
          if (materia.promedio < 6) {
            contadorMateriasDesaprobadas += 1;
          }
        }
        if (inscripcion.materiasPendientes != null) {
          contadorMateriasDesaprobadas +=
            inscripcion.materiasPendientes.length + 1;
        }
        if (contadorMateriasDesaprobadas > 3) {
          idEstado = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Examenes pendientes"
          );
        } else {
          idEstado = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Promovido"
          );
        }
        contadorMateriasDesaprobadas = 0;
        Inscripcion.findByIdAndUpdate(inscripcion._id, {
          estado: idEstado,
        })
          .exec()
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico",
            });
          });
      }
    }
  );
});

/* Al cumplirse la fecha de fin de examenes: El metodo siguiente se fija la cantidad de
materias desaprobadas del año lectivo y la cantidad de materias pendientes y de acuerdo a
eso le cambia el estado a la inscripcion */
router.use("/procesoAutomaticoFinExamenes", (req, res) => {
  let fechaActual = new Date();
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
    date.setSeconds(date.getSeconds() + 5),
    // fechaFinExamenes,
    async () => {
      let obtenerInscripcionesActivas = () => {
        return new Promise((resolve, reject) => {
          Inscripcion.aggregate([
            {
              $match: {
                activa: true,
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
                materiasPendientes: 1,
                CXM: 1,
                idEstudiante: 1,
              },
            },
          ])
            .then((inscripciones) => {
              resolve(inscripciones);
            })
            .catch(() => {
              reject("Error");
            });
        });
      };
      let idEstado;
      let contadorMateriasDesaprobadas = 0;
      let materiasDeInscripcion = await obtenerInscripcionesActivas();

      for (const inscripcion of materiasDeInscripcion) {
        for (const materia of inscripcion.CXM) {
          if (materia.promedio < 6) {
            contadorMateriasDesaprobadas += 1;
          }
        }

        if (inscripcion.materiasPendientes != null) {
          contadorMateriasDesaprobadas +=
            inscripcion.materiasPendientes.length + 1;
        }
        if (contadorMateriasDesaprobadas > 3) {
          idEstado = await ClaseEstado.obtenerIdEstado("Inscripcion", "Libre");
        } else if (contadorMateriasDesaprobadas == 0) {
          idEstado = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Promovido"
          );
        } else {
          idEstado = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Promovido con examenes pendientes"
          );
        }
        contadorMateriasDesaprobadas=0;
        Inscripcion.findByIdAndUpdate(inscripcion._id,{estado:idEstado}).then(async() => {
          let idEstadoEstudiante = await ClaseEstado.obtenerIdEstado(
            "Estudiante",
            "Registrado"
          );
          Estudiante.findByIdAndUpdate(inscripcion.idEstudiante, {
            estado: idEstadoEstudiante,
          }).exec();
        });
      }

      // Inscripcion.aggregate([
      //   {
      //     $match: {
      //       activa: true,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "calificacionesXMateria",
      //       localField: "calificacionesXMateria",
      //       foreignField: "_id",
      //       as: "CXM",
      //     },
      //   },
      //   {
      //     $project: {
      //       materiasPendientes: 1,
      //       CXM: 1,
      //       idEstudiante: 1,
      //     },
      //   },
      // ])
      //   .then((materiasDeInscripcion) => {
      //     //Se actualiza el estado de la inscripción según los estados de las diferentes CXM
      //     //y la cantidad de materias pendientes
      //     let estadoEstudiante;
      //     Estado.findOne({
      //       ambito: "Estudiante",
      //       nombre: "Registrado",
      //     })
      //       .then((estadoEstudiante) => {
      //         estadoEstudiante = estadoEstudiante;
      //       })
      //       .catch(() => {
      //         res.status(500).json({
      //           message: "Mensaje de error especifico",
      //         });
      //       });
      //     materiasDeInscripcion.forEach((inscripcion) => {
      //       inscripcion.CXM.forEach((materia) => {
      //         if (materia.promedio < 6) {
      //           contadorMateriasDesaprobadas += 1;
      //         }
      //       });

      //       if (inscripcion.materiasPendientes != null) {
      //         contadorMateriasDesaprobadas +=
      //           inscripcion.materiasPendientes.length + 1;
      //       }

      //       Estudiante.findById(inscripcion.idEstudiante)
      //         .then((estudiante) => {
      //           estudiante.estado = estadoEstudiante;
      //           estudiante.save();
      //         })
      //         .catch(() => {
      //           res.status(500).json({
      //             message: "Mensaje de error especifico",
      //           });
      //         });

      //       if (contadorMateriasDesaprobadas > 3) {
      //         Estado.findOne({
      //           ambito: "Inscripcion",
      //           nombre: "Libre",
      //         })
      //           .then((estado) => {
      //             Inscripcion.findByIdAndUpdate(inscripcion._id, {
      //               estado: estado._id,
      //             }).exec();
      //           })
      //           .catch(() => {
      //             res.status(500).json({
      //               message: "Mensaje de error especifico",
      //             });
      //           });
      //       } else {
      //         Estado.findOne({ ambito: "Inscripcion", nombre: "Promovido" })
      //           .then((estado) => {
      //             Inscripcion.findByIdAndUpdate(inscripcion._id, {
      //               estado: estado._id,
      //             }).exec();
      //           })
      //           .catch(() => {
      //             res.status(500).json({
      //               message: "Mensaje de error especifico",
      //             });
      //           });
      //       }
      //     });
      //   })
      //   .catch(() => {
      //     res.status(500).json({
      //       message: "Mensaje de error especifico",
      //     });
      //   });
    }
  );
});

module.exports = router;
