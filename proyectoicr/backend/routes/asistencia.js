const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const Estudiante = require("../models/estudiante");
const Inscripcion = require("../models/inscripcion");
const AsistenciaDiaria = require("../models/asistenciaDiaria");
const ClaseSuscripcion = require("../classes/suscripcion");
const ClaseAsistencia = require("../classes/asistencia");
const ClaseEstado = require("../classes/estado");
const ClaseCicloLectivo = require("../classes/cicloLectivo");

async function validarLibreInasistencias(idEst) {
  const idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  const idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  Inscripcion.findOne({
    idEstudiante: idEst,
    estado: idEstadoActiva,
  }).then(async (inscripcion) => {
    if (
      inscripcion &&
      inscripcion.contadorInasistenciasInjustificada >=
        (await ClaseCicloLectivo.obtenerCantidadFaltasSuspension())
    ) {
      Inscripcion.findOneAndUpdate(
        {
          idEstudiante: idEst,
          estado: idEstadoActiva,
        },
        {
          estado: idEstadoSuspendido,
        }
      ).exec();
    } else if (
      inscripcion &&
      inscripcion.contadorInasistenciasInjustificada % 12 == 0
    ) {
      //No fijamos si el estudiante tiene 12 inasistencias, para luego notificar a los AR
      let idsUsuariosAR = await ClaseSuscripcion.obtenerIdsUsuarios(idEst);
      let idsUsuarios = await ClaseSuscripcion.filtrarARPorPreferencias(
        idsUsuariosAR,
        "Falta 12"
      );
      //Si existen ARs que aceptan este tipo de notificacion, manda
      idsUsuarios.length > 0 &&
        Estudiante.findById(idEst).then((estudianteEncontrado) => {
          ClaseSuscripcion.notificacionGrupal(
            idsUsuarios,
            "Atención",
            `El estudiante ${estudianteEncontrado.nombre} ${estudianteEncontrado.apellido} tiene solo 3 inasistencias antes de que sea suspendido`
          );
        });
    }
  });
}

//Retorna vector con datos de los estudiantes y presente. Si ya se registro una asistencia para
//el dia de hoy se retorna ese valor de la asistencia, sino se "construye" una nueva
// @params: req.query.curso Nombre en string del curso que se esta por tomar asistencia
router.get("", checkAuthMiddleware, async (req, res) => {
  const idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  const idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );

  Inscripcion.aggregate([
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "curso",
      },
    },
    {
      $match: {
        "curso.nombre": req.query.curso,
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
          ],
        },
      },
    },
    {
      $project: {
        ultimaAsistencia: {
          $slice: ["$asistenciaDiaria", -1],
        },
      },
    },
    {
      $lookup: {
        from: "asistenciaDiaria",
        localField: "ultimaAsistencia",
        foreignField: "_id",
        as: "asistencia",
      },
    },
    {
      $project: {
        _id: 0,
        "asistencia.fecha": 1,
      },
    },
    {
      $limit: 1,
    },
  ])
    .then((ultimaAsistencia) => {
      if (ultimaAsistencia.length == 0) {
        return res
          .status(200)
          .json({ estudiantes: [], asistenciaNueva: "true" });
      }
      var fechaHoy = new Date();
      fechaHoy.setHours(fechaHoy.getHours() - 3);
      //Compara si la ultima asistencia fue el dia de hoy
      if (
        ultimaAsistencia[0].asistencia.length > 0 &&
        ClaseAsistencia.esFechaActual(ultimaAsistencia[0].asistencia[0].fecha)
      ) {
        Inscripcion.aggregate([
          {
            $lookup: {
              from: "curso",
              localField: "idCurso",
              foreignField: "_id",
              as: "curso",
            },
          },
          {
            $lookup: {
              from: "estudiante",
              localField: "idEstudiante",
              foreignField: "_id",
              as: "datosEstudiante",
            },
          },
          {
            $match: {
              "curso.nombre": req.query.curso,
              estado: {
                $in: [
                  mongoose.Types.ObjectId(idEstadoActiva),
                  mongoose.Types.ObjectId(idEstadoSuspendido),
                ],
              },
            },
          },
          {
            $project: {
              estado: 1,
              ultimaAsistencia: {
                $slice: ["$asistenciaDiaria", -1],
              },
              "datosEstudiante._id": 1,
              "datosEstudiante.nombre": 1,
              "datosEstudiante.apellido": 1,
            },
          },
          {
            $lookup: {
              from: "asistenciaDiaria",
              localField: "ultimaAsistencia",
              foreignField: "_id",
              as: "asistencia",
            },
          },
          {
            $project: {
              estado: 1,
              datosEstudiante: 1,
              "asistencia.presente": 1,
              "asistencia._id": 1,
            },
          },
        ]).then(async (asistenciaCurso) => {
          var respuesta = [];
          for (const estudiante of asistenciaCurso) {
            if (estudiante.asistencia.length == 0) {
              //Para el caso de que se haya inscripto un estudiante nuevo, este no tiene asistencia
              //diaria, entonces la creamos y actualizamos su inscripcion
              var asistenciaNuevaEstudiante = new AsistenciaDiaria({
                idInscripcion: estudiante._id,
                fecha: fechaHoy,
                presente: true,
                valorInasistencia: 0,
                justificado: false,
                llegadaTarde: false,
              });
              await asistenciaNuevaEstudiante
                .save()
                .then((asistenciaGuardada) => {
                  Inscripcion.findByIdAndUpdate(estudiante._id, {
                    $push: { asistenciaDiaria: asistenciaGuardada._id },
                  }).then(() => {
                    var estudianteRefinado = {
                      _id: estudiante.datosEstudiante[0]._id,
                      nombre: estudiante.datosEstudiante[0].nombre,
                      apellido: estudiante.datosEstudiante[0].apellido,
                      idAsistencia: asistenciaGuardada._id,
                      fecha: fechaHoy,
                      presente: true,
                      estado: estudiante.estado,
                    };
                    respuesta.push(estudianteRefinado);
                  });
                });
            } else {
              var estudianteRefinado = {
                _id: estudiante.datosEstudiante[0]._id,
                nombre: estudiante.datosEstudiante[0].nombre,
                apellido: estudiante.datosEstudiante[0].apellido,
                idAsistencia: estudiante.asistencia[0]._id,
                fecha: fechaHoy,
                presente: estudiante.asistencia[0].presente,
                estado: estudiante.estado,
              };
              respuesta.push(estudianteRefinado);
            }
          }
          res
            .status(200)
            .json({ estudiantes: respuesta, asistenciaNueva: "false" });
        });
      } else {
        //Si no se tomo asistencia hoy / nunca se tomo asistencia
        Inscripcion.aggregate([
          {
            $lookup: {
              from: "curso",
              localField: "idCurso",
              foreignField: "_id",
              as: "curso",
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
            $match: {
              "curso.nombre": req.query.curso,
              estado: {
                $in: [
                  mongoose.Types.ObjectId(idEstadoActiva),
                  mongoose.Types.ObjectId(idEstadoSuspendido),
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              "estudiante._id": 1,
              "estudiante.nombre": 1,
              "estudiante.apellido": 1,
              estado: 1,
            },
          },
        ]).then((documents) => {
          const fechaActual = new Date();
          fechaActual.setHours(fechaActual.getHours());
          var estudiantesRedux = [];
          documents.forEach((objConEstudiante) => {
            let estudianteRedux = {
              _id: objConEstudiante.estudiante[0]._id,
              nombre: objConEstudiante.estudiante[0].nombre,
              apellido: objConEstudiante.estudiante[0].apellido,
              fecha: fechaHoy,
              presente: true,
              estado: objConEstudiante.estado,
            };
            estudiantesRedux.push(estudianteRedux);
          });
          return res.status(200).json({
            estudiantes: estudiantesRedux,
            asistenciaNueva: "true",
          });
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el estado de la asistencia para cada alumno",
        error: error.message,
      });
    });
});

// Recibe un vector de estudiantes y para cada uno, encuentra la inscripcion que le corresponde
// luego crea la asistencia diaria usando la _id de la inscripcion, luego guarda la asistenciaDiaria y
// guarda la _id de esta asistenciaDiaria en el vector de asistenciasDiarias de la inscripcion.
// Si ya se tomo asistencia en el dia, se actualiza el valor presente de la asistencia individual.
router.post("", checkAuthMiddleware, async (req, res) => {
  try {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    const idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    let idsEstudiantes = [];
    req.body.forEach((estudiante) => {
      var valorInasistencia = 0;
      if (!estudiante.presente) {
        valorInasistencia = 1;
        idsEstudiantes.push(estudiante._id);
      }
      Inscripcion.findOne({
        idEstudiante: estudiante._id,
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
          ],
        },
      }).then(async (inscripcion) => {
        if (inscripcion) {
          if (inscripcion.asistenciaDiaria.length > 0) {
            var idAD =
              inscripcion.asistenciaDiaria[
                inscripcion.asistenciaDiaria.length - 1
              ]._id;
            AsistenciaDiaria.findById(idAD).then(async (asistencia) => {
              if (!ClaseAsistencia.esFechaActual(asistencia.fecha)) {
                // Condición si la ultima no asistencia corresponde al dia de hoy
                var asistenciaEstudiante = new AsistenciaDiaria({
                  idInscripcion: inscripcion._id,
                  fecha: estudiante.fecha,
                  presente: estudiante.presente,
                  valorInasistencia: valorInasistencia,
                  justificado: false,
                  llegadaTarde: false,
                });

                await asistenciaEstudiante
                  .save()
                  .then(async (asistenciaDiaria) => {
                    await inscripcion.asistenciaDiaria.push(
                      asistenciaDiaria._id
                    );
                    inscripcion.contadorInasistenciasInjustificada =
                      inscripcion.contadorInasistenciasInjustificada +
                      valorInasistencia;
                    inscripcion.save();
                  });
              } else {
                // Si la ultima asistencia si es de hoy
                //Si estaba presente en la bd y se cambio a ausente incrementa contador inasistencia
                if (asistencia.presente && !estudiante.presente) {
                  idsEstudiantes.push(estudiante._id);
                  AsistenciaDiaria.findByIdAndUpdate(asistencia._id, {
                    presente: estudiante.presente,
                  }).then(() => {
                    Inscripcion.findOneAndUpdate(
                      {
                        idEstudiante: estudiante._id,
                        estado: idEstadoActiva,
                      },
                      { $inc: { contadorInasistenciasInjustificada: 1 } }
                    ).exec();
                  });
                  setTimeout(function () {
                    validarLibreInasistencias(estudiante._id);
                  }, 900);
                }
                //Si estaba ausente y lo pasaron a presente decrementa contador inasistencia
                else if (!asistencia.presente && estudiante.presente) {
                  AsistenciaDiaria.findByIdAndUpdate(asistencia._id, {
                    presente: estudiante.presente,
                  }).then(() => {
                    Inscripcion.findOneAndUpdate(
                      {
                        idEstudiante: estudiante._id,
                        estado: idEstadoActiva,
                      },
                      { $inc: { contadorInasistenciasInjustificada: -1 } }
                    ).exec();
                  });
                }
              }
            });
          } else {
            var asistenciaEstudiante = new AsistenciaDiaria({
              idInscripcion: inscripcion._id,
              fecha: estudiante.fecha,
              presente: estudiante.presente,
              valorInasistencia: valorInasistencia,
              justificado: false,
              llegadaTarde: false,
            });

            await asistenciaEstudiante.save().then(async (asistenciaDiaria) => {
              await inscripcion.asistenciaDiaria.push(asistenciaDiaria._id);
              inscripcion.contadorInasistenciasInjustificada =
                inscripcion.contadorInasistenciasInjustificada +
                valorInasistencia;
              inscripcion.save();
            });
          }
        }
      });
      setTimeout(function () {
        validarLibreInasistencias(estudiante._id);
      }, 900);
    });
    if (idsEstudiantes.length > 0) {
      for (const idEstudiante of idsEstudiantes) {
        let idsUsuariosAR = await ClaseSuscripcion.obtenerIdsUsuarios(
          idEstudiante
        );
        let idsUsuarios = await ClaseSuscripcion.filtrarARPorPreferencias(
          idsUsuariosAR,
          "Inasistencia"
        );
        if (idsUsuarios.length > 0) {
          let datosEstudiante = req.body.filter((estudiante) => {
            return estudiante._id == idEstudiante;
          });

          ClaseSuscripcion.notificacionGrupal(
            idsUsuarios,
            `Ausente`,
            `Falta registrada al estudiante ${datosEstudiante[0].nombre} ${datosEstudiante[0].apellido}`
          );
        }
      }
    }
    return res
      .status(201)
      .json({ message: "Asistencia registrada exitosamente", exito: true });
  } catch (error) {
    res.status(500).json({
      message:
        "Ocurrió un problema al querer publicar el presentismo del estudiante",
      error: error.message,
    });
  }
});

//Este metodo filtra las inscripciones por estudiante y retorna el contador de inasistencias (injustificada y justificada)
router.get("/asistenciaEstudiante", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  Inscripcion.find({
    idEstudiante: req.query.idEstudiante,
    $or: [{ estado: idEstadoActiva }, { estado: idEstadoSuspendido }],
  })
    .then((inscripciones) => {
      let contadorInjustificadas = 0;
      let contadorJustificadas = 0;
      if (inscripciones.length > 1) {
        inscripciones.forEach((inscripcion) => {
          contadorInjustificadas +=
            inscripcion.contadorInasistenciasInjustificada;
          contadorJustificadas += inscripcion.contadorInasistenciasJustificada;
        });
      } else {
        contadorInjustificadas =
          inscripciones[0].contadorInasistenciasInjustificada;
        contadorJustificadas =
          inscripciones[0].contadorInasistenciasJustificada;
      }
      res.status(200).json({
        message: "Operacion exitosa",
        exito: true,
        contadorInasistenciasInjustificada: contadorInjustificadas,
        contadorInasistenciasJustificada: contadorJustificadas,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer devolver los contadores de inasistencias",
        error: error.message,
      });
    });
});

//Recibe vector con inasistencias, cada una tiene su _id y si fue o no justificada
router.post(
  "/inasistencia/justificada",
  checkAuthMiddleware,
  async (req, res) => {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    let contador = 0;
    req.body.ultimasInasistencias.forEach((inasistencia) => {
      if (inasistencia.justificado) {
        contador = contador + 1;
        AsistenciaDiaria.findByIdAndUpdate(inasistencia.idAsistencia, {
          justificado: true,
        }).exec();
      }
    });
    Inscripcion.findOneAndUpdate(
      { idEstudiante: req.body.idEstudiante, estado: idEstadoActiva },
      {
        $inc: {
          contadorInasistenciasJustificada: contador,
          contadorInasistenciasInjustificada: contador * -1,
        },
      }
    )
      .then(() => {
        res.status(200).json({
          message: "Inasistencias justificadas correctamente",
          exito: true,
        });
      })
      .catch((error) => {
        res.status(500).json({
          message:
            "Ocurrió un error al querer publicar el estado de las inasistencias (justificada / injustificada). ",
          error: error.message,
        });
      });
  }
);

//Se obtienen las ultimas 5 inasistencias del estudiante, se permite justificar las inasistencias
//que fueron creadas en los ultimos 5 dias
//Se utiliza para la justificacion de inasistencias
router.get("/inasistencias", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let ultimasInasistencias = [];
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: mongoose.Types.ObjectId(idEstadoActiva),
      },
    },
    {
      $project: {
        asistenciaDiaria: {
          $slice: ["$asistenciaDiaria", -5],
        },
      },
    },
    {
      $unwind: {
        path: "$asistenciaDiaria",
      },
    },
    {
      $lookup: {
        from: "asistenciaDiaria",
        localField: "asistenciaDiaria",
        foreignField: "_id",
        as: "presentismo",
      },
    },
    {
      $match: {
        "presentismo.presente": false,
        "presentismo.justificado": false,
      },
    },
    {
      $project: {
        _id: 0,
        "presentismo._id": 1,
        "presentismo.fecha": 1,
        "presentismo.justificado": 1,
      },
    },
  ])
    .then((response) => {
      if (response.length > 0) {
        //Limita a que se puedan justificar las inasistencias de los ultimos 5 dias
        fechalimiteInferior = new Date(new Date() - 24 * 60 * 60 * 1000 * 5);
        fechalimiteSuperior = new Date();
        response.forEach((objeto) => {
          if (
            objeto.presentismo[0].fecha > fechalimiteInferior &&
            objeto.presentismo[0].fecha <= fechalimiteSuperior
          ) {
            ultimasInasistencias.push({
              idAsistencia: objeto.presentismo[0]._id,
              fecha: objeto.presentismo[0].fecha,
              justificado: objeto.presentismo[0].justificado,
            });
          }
        });
        return res.status(200).json({
          exito: true,
          message: "Inasistencias obtenidas con éxito",
          inasistencias: ultimasInasistencias,
        });
      }
      res.status(200).json({
        exito: false,
        message: "El estudiante no tiene inasistencias en los últimos 5 días",
        inasistencias: [],
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el estado de las inasistencias (justificada / injustificada)",
        error: error.message,
      });
    });
});

/* Se fija si al estudiante ya le crearon una asistencia el dia de hoy, si no le tomaron le crea una asistencia.
  Para cualquiera de los casos se le asigna presente al estudiante para ese dia. La llegada tarde puede ser antes de las 8
  am o despues de ese horario. Si es antes de las 8 am y tiene acumuladas 4 llegadas tardes
 de ese tipo le asigna una falta injustificada. Si es despues de las 8 am se le asigna media falta injustificada.  */
router.post("/llegadaTarde", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  Inscripcion.findOne({
    idEstudiante: req.body.idEstudiante,
    estado: idEstadoActiva,
  })
    .then((inscripcion) => {
      AsistenciaDiaria.findById(
        inscripcion.asistenciaDiaria[inscripcion.asistenciaDiaria.length - 1]
      ).then(async (ultimaAD) => {
        var ADcreada = null;
        var fechaHoy = new Date();
        fechaHoy.setHours(fechaHoy.getHours() - 3);
        let estudianteAusente = false;
        //Chequea si el estudiante tiene o no el array de AsistenciaDiaria
        if (ultimaAD == null) {
          return res.status(200).json({
            message:
              "El estudiante no tiene registrada una asistencia para el dia de hoy",
            exito: false,
          });
        } else {
          //Compara si la ultima asistencia fue el dia de hoy
          if (!ClaseAsistencia.esFechaActual(ultimaAD.fecha)) {
            if (!ultimaAD.llegadaTarde) {
              var nuevaAsistencia = new AsistenciaDiaria({
                idInscripcion: inscripcion._id,
                fecha: fechaHoy,
                presente: true,
                retiroAnticipado: false,
                valorInasistencia: 0,
                justificado: false,
                llegadaTarde: true,
              });
              await nuevaAsistencia.save().then((ADultima) => {
                ADcreada = ADultima;
                ultimaAD = ADultima;
              });
            } else {
              return res.status(200).json({
                message:
                  "Ya exite una llegada tarde registrada para el estudiante seleccionado",
                exito: false,
              });
            }
          } else {
            //Estudiante tiene una AD que se la crearon el dia de hoy
            if (!ultimaAD.llegadaTarde) {
              //No tiene una llegada tarde registrada
              if (!ultimaAD.presente) {
                //Estaba registrado como ausente
                ultimaAD.presente = true;
                estudianteAusente = true; //Si el estudiante estuvo ausente, no se le deberia sumar mas inasistencia
              }
            } else {
              return res.status(200).json({
                message:
                  "Ya exite una llegada tarde registrada para el estudiante seleccionado",
                exito: false,
              });
            }
          }

          if (req.body.antes8am && inscripcion.contadorLlegadasTarde < 3) {
            inscripcion.contadorLlegadasTarde =
              inscripcion.contadorLlegadasTarde + 1;
            if (ADcreada != null) {
              inscripcion.asistenciaDiaria.push(ADcreada._id);
            }
            inscripcion.save();
            ultimaAD.llegadaTarde = true;
            setTimeout(function () {
              validarLibreInasistencias(inscripcion.idEstudiante);
            }, 900);
            ultimaAD.save().then(() => {
              return res.status(200).json({
                message: "Llegada tarde registrada exitosamente",
                exito: true,
              });
            });
          } else {
            if (req.body.antes8am && inscripcion.contadorLlegadasTarde >= 3) {
              inscripcion.contadorLlegadasTarde = 0;
              inscripcion.contadorInasistenciasInjustificada =
                inscripcion.contadorInasistenciasInjustificada + 1;
              if (ADcreada != null) {
                inscripcion.asistenciaDiaria.push(ADcreada._id);
              }
              inscripcion.save();
              ultimaAD.valorInasistencia = ultimaAD.valorInasistencia + 1;
              ultimaAD.llegadaTarde = true;
              setTimeout(function () {
                validarLibreInasistencias(inscripcion.idEstudiante);
              }, 900);
              ultimaAD.save().then(() => {
                return res.status(200).json({
                  message: "Llegada tarde registrada exitosamente",
                  exito: true,
                });
              });
            } else {
              if (!estudianteAusente) {
                //Si el estudiante estuvo ausente, no se le deberia sumar mas inasistencia porque ya se le sumo cuando se le toma asistencia
                inscripcion.contadorInasistenciasInjustificada =
                  inscripcion.contadorInasistenciasInjustificada + 0.5;
              }
              if (ADcreada != null) {
                inscripcion.asistenciaDiaria.push(ADcreada._id);
              }
              inscripcion.save();
              ultimaAD.valorInasistencia = 0.5;
              ultimaAD.llegadaTarde = true;
              setTimeout(function () {
                validarLibreInasistencias(inscripcion.idEstudiante);
              }, 900);
              ultimaAD.save().then(() => {
                return res.status(200).json({
                  message: "Llegada tarde registrada exitosamente",
                  exito: true,
                });
              });
            }
          }
        }
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer publicar la llegada tarde de un estudiante",
        error: error.message,
      });
    });
});

//Obtiene la id de la asistencia diaria del dia de hoy, y cambia los valores de la inasistencia para indicar el retiro correspondiente
router.post("/retiro", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  Inscripcion.findOne(
    { idEstudiante: req.body.idEstudiante, estado: idEstadoActiva },
    { asistenciaDiaria: { $slice: -1 } }
  )
    .then((inscripcion) => {
      if (!inscripcion) {
        res.status(200).json({
          message: "El estudiante no está inscripto en ningún curso",
          exito: false,
        });
      } else {
        var actualizacionInasistencia = 0.5;
        if (req.body.antes10am) {
          actualizacionInasistencia = 1;
        }
        AsistenciaDiaria.findById(inscripcion.asistenciaDiaria[0])
          .select({ retiroAnticipado: 1, presente: 1, justificado: 1 })
          .then((asistencia) => {
            if (asistencia) {
              if (!asistencia.presente) {
                res.status(200).json({
                  message: "El estudiante esta ausente para el día de hoy",
                  exito: "ausente",
                });
              } else {
                if (asistencia.retiroAnticipado) {
                  res.status(200).json({
                    message:
                      "El estudiante ya tiene registrado un retiro anticipado para el día de hoy",
                    exito: "retirado",
                  });
                } else {
                  AsistenciaDiaria.findByIdAndUpdate(
                    inscripcion.asistenciaDiaria[0],
                    {
                      retiroAnticipado: true,
                      $inc: { valorInasistencia: actualizacionInasistencia },
                    }
                  ).then(() => {
                    if (!asistencia.justificado) {
                      //Si el estudiante tiene ya registrada una falta pero esta justificada, el retiro no deberia sumar mas inasistencias
                      inscripcion.contadorInasistenciasInjustificada += actualizacionInasistencia;
                    }
                    inscripcion.save().then(async () => {
                      //Envio de notificación a los adultos responsables del estudiante. #working
                      let idsUsuariosAR = await ClaseSuscripcion.obtenerIdsUsuarios(
                        req.body.idEstudiante
                      );
                      let idsUsuarios = await ClaseSuscripcion.filtrarARPorPreferencias(
                        idsUsuariosAR,
                        "Retiro Anticipado"
                      );

                      if (idsUsuarios.length > 0) {
                        var tutores = req.body.tutoresSeleccionados;
                        var cuerpo =
                          "Se ha registrado un retiro anticipado de " +
                          estudiante.apellido +
                          " " +
                          estudiante.nombre +
                          ". ";

                        if (tutores.length > 0) {
                          cuerpo =
                            cuerpo +
                            "El estudiante fue retirado por " +
                            tutores[0].apellido +
                            " " +
                            tutores[0].nombre;

                          for (let i = 0; i < tutores.length; i++) {
                            if (i == tutores.length - 1) {
                              cuerpo =
                                cuerpo +
                                " y " +
                                tutores[i].apellido +
                                " " +
                                tutores[i].nombre;
                            } else if (i != 0) {
                              cuerpo =
                                cuerpo +
                                ", " +
                                tutores[i].apellido +
                                " " +
                                tutores[i].nombre;
                            }
                            if (i == tutores.length - 1) cuerpo = cuerpo + ".";
                          }
                        }
                        ClaseSuscripcion.notificacionGrupal(
                          idsUsuarios,
                          "Retiro anticipado",
                          this.cuerpo
                        );
                      }
                      res.status(200).json({
                        message: "Retiro anticipado exitosamente registrado",
                        exito: "exito",
                      });
                    });
                  });
                  setTimeout(function () {
                    validarLibreInasistencias(inscripcion.idEstudiante);
                  }, 900);
                }
              }
            } else {
              res.status(200).json({
                message:
                  "El estudiante no tiene registrada la asistencia para el día de hoy",
                exito: "faltaasistencia",
              });
            }
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer registrar el retiro anticipado",
        error: error.message,
      });
    });
});

module.exports = router;
