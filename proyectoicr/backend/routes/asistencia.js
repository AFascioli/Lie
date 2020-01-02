const express = require("express");
const Inscripcion = require("../models/inscripcion");
const AsistenciaDiaria = require("../models/asistenciaDiaria");
const CicloLectivo = require("../models/cicloLectivo");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const ClaseAsistencia = require("../classes/asistencia");

//Retorna vector con datos de los estudiantes y presente. Si ya se registro una asistencia para
//el dia de hoy se retorna ese valor de la asistencia, sino se "construye" una nueva
//#resolve
router.get("", checkAuthMiddleware, (req, res) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "curso"
      }
    },
    {
      $match: {
        "curso.curso": req.query.curso,
        activa: true
      }
    },
    {
      //#resolve porque capaz no funciona si no tiene asistencias y salta error
      $project: {
        ultimaAsistencia: {
          $slice: ["$asistenciaDiaria", -1]
        }
      }
    },
    {
      $lookup: {
        from: "asistenciaDiaria",
        localField: "ultimaAsistencia",
        foreignField: "_id",
        as: "asistencia"
      }
    },
    {
      $project: {
        _id: 0,
        "asistencia.fecha": 1
      }
    },
    {
      $limit: 1
    }
  ]).then(ultimaAsistencia => {
    var fechaHoy = new Date();
    fechaHoy.setHours(fechaHoy.getHours() - 3);
    //Compara si la ultima asistencia fue el dia de hoy
    console.log(ClaseAsistencia.esFechaActual(ultimaAsistencia[0].asistencia[0].fecha));
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
            as: "curso"
          }
        },
        {
          $lookup: {
            from: "estudiante",
            localField: "idEstudiante",
            foreignField: "_id",
            as: "datosEstudiante"
          }
        },
        {
          $match: {
            "curso.curso": req.query.curso,
            activa: true
          }
        },
        {
          $project: {
            ultimaAsistencia: {
              $slice: ["$asistenciaDiaria", -1]
            },
            "datosEstudiante._id": 1,
            "datosEstudiante.nombre": 1,
            "datosEstudiante.apellido": 1
          }
        },
        {
          $lookup: {
            from: "asistenciaDiaria",
            localField: "ultimaAsistencia",
            foreignField: "_id",
            as: "asistencia"
          }
        },
        {
          $project: {
            datosEstudiante: 1,
            "asistencia.presente": 1,
            "asistencia._id": 1
          }
        }
      ]).then(async asistenciaCurso => {
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
              llegadaTarde: 0
            });
            await asistenciaNuevaEstudiante.save().then(asistenciaGuardada => {
              Inscripcion.findByIdAndUpdate(estudiante._id, {
                $push: { asistenciaDiaria: asistenciaGuardada._id }
              }).then(() => {
                var estudianteRefinado = {
                  _id: estudiante.datosEstudiante[0]._id,
                  nombre: estudiante.datosEstudiante[0].nombre,
                  apellido: estudiante.datosEstudiante[0].apellido,
                  idAsistencia: asistenciaGuardada._id,
                  fecha: fechaHoy,
                  presente: true
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
              presente: estudiante.asistencia[0].presente
            };
            respuesta.push(estudianteRefinado);
          }
        }
        res
          .status(200)
          .json({ estudiantes: respuesta, asistenciaNueva: "false" });
      });
    } else {
      Inscripcion.aggregate([
        {
          $lookup: {
            from: "curso",
            localField: "idCurso",
            foreignField: "_id",
            as: "curso"
          }
        },
        {
          $lookup: {
            from: "estudiante",
            localField: "idEstudiante",
            foreignField: "_id",
            as: "estudiante"
          }
        },
        {
          $match: { "curso.curso": req.query.curso, activa: true }
        },
        {
          $project: {
            _id: 0,
            "estudiante._id": 1,
            "estudiante.nombre": 1,
            "estudiante.apellido": 1
          }
        }
      ]).then(documents => {
        const fechaActual = new Date();
        fechaActual.setHours(fechaActual.getHours());
        var estudiantesRedux = [];
        documents.forEach(objConEstudiante => {
          let estudianteRedux = {
            _id: objConEstudiante.estudiante[0]._id,
            nombre: objConEstudiante.estudiante[0].nombre,
            apellido: objConEstudiante.estudiante[0].apellido,
            fecha: fechaHoy,
            presente: true
          };
          estudiantesRedux.push(estudianteRedux);
        });
        res.status(200).json({
          estudiantes: estudiantesRedux,
          asistenciaNueva: "true"
        });
      });
    }
  });
});

// Registrar asistencia 2.0, recibe un vector de estudiantes y para cada uno, encuentra la inscripcion que le corresponde
// luego crea la asistencia diaria usando la _id de la inscripcion, luego guarda la asistenciaDiaria y
// guarda la _id de esta asistenciaDiaria en el vector de asistenciasDiarias de la inscripcion.
// Si ya se tomo asistencia en el dia, se actualiza el valor presente de la asistencia individual.
router.post("", checkAuthMiddleware, (req, res) => {
  if (req.query.asistenciaNueva == "true") {
    req.body.forEach(estudiante => {
      var valorInasistencia = 0;
      if (!estudiante.presente) {
        valorInasistencia = 1;
      }
      Inscripcion.findOne({
        idEstudiante: estudiante._id,
        activa: true
      }).then(async inscripcion => {
        var asistenciaEstudiante = new AsistenciaDiaria({
          idInscripcion: inscripcion._id,
          fecha: estudiante.fecha,
          presente: estudiante.presente,
          valorInasistencia: valorInasistencia,
          justificado: false
        });

        await asistenciaEstudiante.save().then(async asistenciaDiaria => {
          await inscripcion.asistenciaDiaria.push(asistenciaDiaria._id);
          inscripcion.contadorInasistenciasInjustificada =
            inscripcion.contadorInasistenciasInjustificada + valorInasistencia;
          inscripcion.save();
        });
      });
    });
  } else {
    req.body.forEach(estudiante => {
      AsistenciaDiaria.findById(estudiante.idAsistencia).then(asistencia => {
        //si estaba presente en la bd y se cambio a ausente incrementa contador inasistencia
        if (asistencia.presente && !estudiante.presente) {
          AsistenciaDiaria.findByIdAndUpdate(estudiante.idAsistencia, {
            presente: estudiante.presente
          }).then(() => {
            Inscripcion.findOneAndUpdate(
              {
                idEstudiante: estudiante._id,
                activa: true
              },
              { $inc: { contadorInasistenciasInjustificada: 1 } }
            ).exec();
          });
        }
        //si estaba ausente y lo pasaron a presente decrementa contador inasistencia
        else if (!asistencia.presente && estudiante.presente) {
          AsistenciaDiaria.findByIdAndUpdate(estudiante.idAsistencia, {
            presente: estudiante.presente
          }).then(() => {
            Inscripcion.findOneAndUpdate(
              {
                idEstudiante: estudiante._id,
                activa: true
              },
              { $inc: { contadorInasistenciasInjustificada: -1 } }
            ).exec();
          });
        }
      });
    });
  }
  res
    .status(201)
    .json({ message: "Asistencia registrada exitosamente", exito: true });
});

//Este metodo filtra las inscripciones por estudiante y retorna el contador de inasistencias (injustificada y justificada)
router.get("/asistenciaEstudiante", (req, res) => {
  Inscripcion.findOne({ idEstudiante: req.query.idEstudiante }).then(
    estudiante => {
      res.status(200).json({
        message: "Operacion exitosa",
        exito: true,
        contadorInasistenciasInjustificada:
          estudiante.contadorInasistenciasInjustificada,
        contadorInasistenciasJustificada:
          estudiante.contadorInasistenciasJustificada
      });
    }
  );
});

//Recibe vector con inasistencias, cada una tiene su _id y si fue o no justificada
router.post("/inasistencia/justificada", checkAuthMiddleware, (req, res) => {
  let contador = 0;
  req.body.ultimasInasistencias.forEach(inasistencia => {
    if (inasistencia.justificado) {
      contador = contador + 1;
      AsistenciaDiaria.findByIdAndUpdate(inasistencia.idAsistencia, {
        justificado: true
      })
        .exec()
        .catch(() => {
          res.status(200).json({
            message: "Ocurrió un error al querer justificar la inasistencia ",
            exito: false
          });
        });
    }
  });
  Inscripcion.findOneAndUpdate(
    { idEstudiante: req.body.idEstudiante, activa: true },
    {
      $inc: {
        contadorInasistenciasJustificada: contador,
        contadorInasistenciasInjustificada: contador * -1
      }
    }
  ).then(() => {
    res.status(200).json({
      message: "Inasistencias justificadas correctamente",
      exito: true
    });
  });
});

//Se obtienen las ultimas inasistencias dentro de un periodo de 5 dias antes
//Se utiliza para la justificacion de inasistencias
//Se valida que solo se pueda justificar inasistencias para el trimestre actual
router.get("/inasistencias", (req, res) => {
  let fechaActual = new Date();

  CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then(
    cicloLectivo => {
      if (ClaseAsistencia.validarFechasJustificar(cicloLectivo)) {
        return res.status(200).json({
          exito: true,
          message:
            "La fecha actual se encuentra dentro de las fechas permitidas para justificar inasistencias"
        });
      } else {
        return res.status(200).json({
          exito: false,
          message:
            "La fecha actual no se encuentra dentro de las fechas permitidas para justificar inasistencias"
        });
      }
    }
  );

  let ultimasInasistencias = [];
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante)
      }
    },
    {
      //#resolve, revisar cuando no tiene 5 asistenciasdiarias
      $project: {
        asistenciaDiaria: {
          $slice: ["$asistenciaDiaria", -5]
        }
      }
    },
    {
      $unwind: {
        path: "$asistenciaDiaria"
      }
    },
    {
      $lookup: {
        from: "asistenciaDiaria",
        localField: "asistenciaDiaria",
        foreignField: "_id",
        as: "presentismo"
      }
    },
    {
      $match: {
        "presentismo.presente": false,
        "presentismo.justificado": false
      }
    },
    {
      $project: {
        _id: 0,
        "presentismo._id": 1,
        "presentismo.fecha": 1,
        "presentismo.justificado": 1
      }
    }
  ]).then(response => {
    if (response.length > 0) {
      response.forEach(objeto => {
        if (
          objeto.presentismo[0].fecha > fechaLimiteInferior &&
          objeto.presentismo[0].fecha < fechaLimiteSuperior
        ) {
          ultimasInasistencias.push({
            idAsistencia: objeto.presentismo[0]._id,
            fecha: objeto.presentismo[0].fecha,
            justificado: objeto.presentismo[0].justificado
          });
        }
      });
      return res.status(200).json({
        exito: true,
        message: "Inasistencias obtenidas con éxito",
        inasistencias: ultimasInasistencias
      });
    }
    res.status(200).json({
      exito: false,
      message: "El estudiante no tiene inasistencias en los últimos 5 días",
      inasistencias: []
    });
  });
});

/* Se fija si al estudiante ya le crearon una asistencia el dia de hoy, si no le tomaron le crea una asistencia.
  Para cualquiera de los casos se le asigna presente al estudiante para ese dia. La llegada tarde puede ser antes de las 8 am o despues de ese horario. Si es antes de las 8 am y tiene acumuladas 4 llegadas tardes
 de ese tipo le asigna una falta injustificada. Si es despues de las 8 am se le asigna media falta injustificada.  */
router.post("/llegadaTarde", checkAuthMiddleware, (req, res) => {
  Inscripcion.findOne({
    idEstudiante: req.body.idEstudiante
  })
    .then(inscripcion => {
      AsistenciaDiaria.findById(
        inscripcion.asistenciaDiaria[inscripcion.asistenciaDiaria.length - 1]
      ).then(async ultimaAD => {
        var ADcreada = null;
        var fechaHoy = new Date();
        fechaHoy.setHours(fechaHoy.getHours() - 3);
        //Compara si la ultima asistencia fue el dia de hoy
        if (!ClaseAsistencia.esFechaActual(ultimaAD)) {
          var nuevaAsistencia = new AsistenciaDiaria({
            idInscripcion: inscripcion._id,
            fecha: fechaHoy,
            presente: true,
            retiroAnticipado: false,
            valorInasistencia: 0,
            justificado: false
          });
          await nuevaAsistencia.save().then(ADultima => {
            ADcreada = ADultima;
            ultimaAD = ADultima;
          });
        } else {
          if (!ultimaAD.llegadaTarde) {
            ultimaAD.presente = true;
            ultimaAD.save();
          } else {
            return res.status(201).json({
              message:
                "Ya exite una llegada tarde registrada para el estudiante seleccionado",
              exito: false
            });
          }
        }

        if (req.body.antes8am && inscripcion.contadorLlegadasTarde < 4) {
          inscripcion.contadorLlegadasTarde =
            inscripcion.contadorLlegadasTarde + 1;
          if (ADcreada != null) {
            inscripcion.asistenciaDiaria.push(ADcreada._id);
          }
          inscripcion.save();
          ultimaAD.llegadaTarde = true;
          ultimaAD.save().then(() => {
            return res.status(201).json({
              message:
                "Llegada tarde antes de las 8 am registrada exitosamente",
              exito: true
            });
          });
        } else {
          if (req.body.antes8am && inscripcion.contadorLlegadasTarde == 4) {
            inscripcion.contadorLlegadasTarde = 0;
            inscripcion.inscripcion.contadorInasistenciasInjustificada =
              inscripcion.contadorInasistenciasInjustificada + 1;
            if (ADcreada != null) {
              inscripcion.asistenciaDiaria.push(ADcreada._id);
            }
            inscripcion.save();
            ultimaAD.valorInasistencia = ultimaAD.valorInasistencia + 1;
            ultimaAD.llegadaTarde = true;
            ultimaAD.save().then(() => {
              return res.status(201).json({
                message:
                  "Llegada tarde antes de las 8 am registrada exitosamente",
                exito: true
              });
            });
          } else {
            inscripcion.contadorInasistenciasInjustificada =
              inscripcion.contadorInasistenciasInjustificada + 0.5;
            if (ADcreada != null) {
              inscripcion.asistenciaDiaria.push(ADcreada._id);
            }
            inscripcion.save();
            ultimaAD.valorInasistencia = ultimaAD.valorInasistencia + 0.5;
            ultimaAD.llegadaTarde = true;
            ultimaAD.save().then(() => {
              return res.status(201).json({
                message:
                  "Llegada tarde después de las 8 am registrada exitosamente",
                exito: true
              });
            });
          }
        }
      });
    })
    .catch(e => {
      res.status(201).json({
        message: "No se pudo asignar la llegada tarde",
        exito: false
      });
    });
});

//Obtiene la id de la asistencia diaria del dia de hoy, y cambia los valores de la inasistencia para indicar el retiro correspondiente
router.post("/retiro", checkAuthMiddleware, (req, res) => {
  Inscripcion.findOne(
    { idEstudiante: req.body.idEstudiante, activa: true },
    { asistenciaDiaria: { $slice: -1 } }
  ).then(inscripcion => {
    if (!inscripcion) {
      res.status(200).json({
        message: "El estudiante no está inscripto en ningún curso",
        exito: false
      });
    } else {
      var actualizacionInasistencia = 0.5;
      if (req.body.antes10am) {
        actualizacionInasistencia = 1;
      }
      AsistenciaDiaria.findById(inscripcion.asistenciaDiaria[0])
        .select({ retiroAnticipado: 1, presente: 1 })
        .then(asistencia => {
          if (asistencia) {
            if (!asistencia.presente) {
              res.status(200).json({
                message: "El estudiante esta ausente para el día de hoy",
                exito: "ausente"
              });
            } else {
              if (asistencia.retiroAnticipado) {
                res.status(200).json({
                  message:
                    "El estudiante ya tiene registrado un retiro anticipado para el día de hoy",
                  exito: "retirado"
                });
              } else {
                AsistenciaDiaria.findByIdAndUpdate(
                  inscripcion.asistenciaDiaria[0],
                  {
                    retiroAnticipado: true,
                    $inc: { valorInasistencia: actualizacionInasistencia }
                  }
                ).then(() => {
                  inscripcion.contadorInasistenciasInjustificada =
                    inscripcion.contadorInasistenciasInjustificada +
                    actualizacionInasistencia;
                  inscripcion.save().then(() => {
                    res.status(200).json({
                      message: "Retiro anticipado exitosamente registrado",
                      exito: "exito"
                    });
                  });
                });
              }
            }
          } else {
            res.status(200).json({
              message:
                "El estudiante no tiene registrada la asistencia para el día de hoy",
              exito: "faltaasistencia"
            });
          }
        })
        .catch(e => console.log(e));
    }
  });
});

module.exports = router;
