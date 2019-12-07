const express = require("express");
const Estudiante = require("../models/estudiante");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const AsistenciaDiaria = require("../models/asistenciaDiaria");
const Suscripcion = require("../classes/suscripcion");
const CicloLectivo = require("../models/cicloLectivo");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const router = express.Router();
const mongoose = require("mongoose");

const checkAuthMiddleware = require("../middleware/check-auth");

//Registra un nuevo estudiante y pone su estado a registrado
router.post("", checkAuthMiddleware, (req, res, next) => {
  Estudiante.findOne({
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento
  }).then(estudiante => {
    if (estudiante) {
      res.status(200).json({
        message: "El estudiante ya se encuentra registrado",
        exito: false
      });
    } else {
      Estado.findOne({
        ambito: "Estudiante",
        nombre: "Registrado"
      }).then(estado => {
        const estudiante = new Estudiante({
          apellido: req.body.apellido,
          nombre: req.body.nombre,
          tipoDocumento: req.body.tipoDocumento,
          numeroDocumento: req.body.numeroDocumento,
          cuil: req.body.cuil,
          sexo: req.body.sexo,
          calle: req.body.calle,
          numeroCalle: req.body.numeroCalle,
          piso: req.body.piso,
          departamento: req.body.departamento,
          provincia: req.body.provincia,
          localidad: req.body.localidad,
          codigoPostal: req.body.codigoPostal,
          nacionalidad: req.body.nacionalidad,
          fechaNacimiento: req.body.fechaNacimiento,
          estadoCivil: req.body.estadoCivil,
          telefonoFijo: req.body.telefonoFijo,
          adultoResponsable: [],
          activo: true,
          estado: estado._id
        });
        estudiante
          .save()
          .then(() => {
            res.status(201).json({
              message: "Estudiante registrado correctamente",
              exito: true
            });
          })
          .catch(err =>
            res.status(200).json({
              message:
                "Ocurrió un error al meter en la base de datos a un estudiante",
              exito: false
            })
          );
      });
    }
  });
});

//Obtiene un estudiante dado un numero y tipo de documento
router.get("/documento", checkAuthMiddleware, (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  Estudiante.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
    activo: true
  }).then(documents => {
    res.status(200).json({
      estudiantes: documents
    });
  });
});

//Busqueda de un estudisante por nombre y apellido ignorando mayusculas
router.get("/nombreyapellido", checkAuthMiddleware, (req, res, next) => {
  const nombre = req.query.nombre;
  const apellido = req.query.apellido;
  Estudiante.find({
    nombre: { $regex: new RegExp(nombre, "i") },
    apellido: { $regex: new RegExp(apellido, "i") },
    activo: true
  }).then(documents => {
    res.status(200).json({
      estudiantes: documents
    });
  });
});

//Modifica un estudiante
router.patch("/modificar", checkAuthMiddleware, (req, res, next) => {
  Estudiante.findByIdAndUpdate(req.body._id, {
    apellido: req.body.apellido,
    nombre: req.body.nombre,
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
    cuil: req.body.cuil,
    sexo: req.body.sexo,
    calle: req.body.calle,
    numeroCalle: req.body.numeroCalle,
    piso: req.body.piso,
    departamento: req.body.departamento,
    provincia: req.body.provincia,
    localidad: req.body.localidad,
    codigoPostal: req.body.codigoPostal,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    estadoCivil: req.body.estadoCivil,
    telefonoFijo: req.body.telefonoFijo
  })
    .then(() => {
      res.status(200).json({
        message: "Estudiante modificado exitosamente",
        exito: true
      });
    })
    .catch(err => {
      res.status(200).json({
        message: "Ocurrió un problema al intentar modificar el estudiante",
        exito: false
      });
    });
});

//Borrado logico de un estudiante
router.delete("/borrar", checkAuthMiddleware, (req, res, next) => {
  Estado.findOne({
    ambito: "Estudiante",
    nombre: "De baja"
  }).then(estado => {
    Estudiante.findOneAndUpdate(
      { _id: req.query._id },
      { activo: false, estado: estado._id }
    ).then(() => {
      Inscripcion.findOne({
        idEstudiante: req.query._id,
        activa: true
      }).then(inscripcion => {
        if (inscripcion) {
          inscripcion.activa = false;
          inscripcion.save();
        }
        res.status(202).json({
          message: "Estudiante exitosamente borrado"
        });
      });
    });
  });
});

//Dada una id de estudiante, se fija si esta inscripto en un curso
router.get("/curso", checkAuthMiddleware, (req, res) => {
  Estudiante.findOne({ _id: req.query.idEstudiante, activo: true }).then(
    estudiante => {
      Estado.findById(estudiante.estado).then(estado => {
        if (estado.nombre == "Inscripto") {
          res.status(200).json({
            message:
              "El estudiante seleccionado ya se encuentra inscripto en un curso",
            exito: true
          });
        } else {
          res.status(200).json({
            message: "El estudiante seleccionado no esta inscripto en un curso",
            exito: false
          });
        }
      });
    }
  );
});

//Retorna vector con datos de los estudiantes y presente. Si ya se registro una asistencia para
//el dia de hoy se retorna ese valor de la asistencia, sino se "construye" una nueva
//#resolve
router.get("/asistencia", checkAuthMiddleware, (req, res) => {
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
    if (
      ultimaAsistencia[0].asistencia.length > 0 &&
      fechaHoy.getDate() == ultimaAsistencia[0].asistencia[0].fecha.getDate() &&
      fechaHoy.getMonth() ==
        ultimaAsistencia[0].asistencia[0].fecha.getMonth() &&
      fechaHoy.getFullYear() ==
        ultimaAsistencia[0].asistencia[0].fecha.getFullYear()
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
      ]).then(asistenciaCurso => {
        var respuesta = [];
        asistenciaCurso.forEach(estudiante => {
          var estudianteRefinado = {
            _id: estudiante.datosEstudiante[0]._id,
            nombre: estudiante.datosEstudiante[0].nombre,
            apellido: estudiante.datosEstudiante[0].apellido,
            idAsistencia: estudiante.asistencia[0]._id,
            fecha: fechaHoy,
            presente: estudiante.asistencia[0].presente
          };
          respuesta.push(estudianteRefinado);
        });
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
router.post("/asistencia", checkAuthMiddleware, (req, res) => {
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

//Recibe por parametros un vector de los estudiantes con los respectivos documentos entregados
router.post("/documentos", checkAuthMiddleware, (req, res) => {
  try {
    req.body.forEach(estudiante => {
      Inscripcion.findOneAndUpdate(
        { idEstudiante: estudiante.idEstudiante, activa: true },
        { $set: { documentosEntregados: estudiante.documentosEntregados } }
      ).exec();
    });
    res
      .status(201)
      .json({ message: "Documentos guardados correctamente", exito: true });
  } catch {
    res.status(201).json({ message: e, exito: false });
  }
});

//Dado un id de estudiante obtiene todas las materias desaprobadas
router.get("/materiasDesaprobadas", (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante)
      }
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "CXM"
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "CXM.idMateria",
        foreignField: "_id",
        as: "nombreCXM"
      }
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "materiasPendientes",
        foreignField: "_id",
        as: "materiasPendientesArray"
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasPendientesArray.idMateria",
        foreignField: "_id",
        as: "materiasPendientesNombres"
      }
    },
    {
      $project: {
        materiasPendientesNombres: 1,
        nombreCXM: 1,
        CXM: 1,
        materiasPendientesArray: 1
      }
    }
  ]).then(materias => {
    materiasDesaprobadas = [];
    if (materias[0].materiasPendientesNombres.length != 0) {
      materiasDesaprobadas.push(materias[0].materiasPendientesNombres);
    }
    for (i = 0; i < materias[0].CXM.length - 1; i++) {
      if (materias[0].CXM[i].promedio != 0) {
        materiasDesaprobadas.push(materias[0].nombreCXM[i]);
      }
    }

    if (materiasDesaprobadas) {
      res.status(200).json({
        message: "Materias desaprobadas obtenidas correctamente",
        exito: true,
        materiasDesaprobadas: materiasDesaprobadas
      });
    } else {
      res.status(200).json({
        message: "El alumno seleccionado no tiene materias desaprobadas",
        exito: true,
        materiasDesaprobadas: []
      });
    }
  });
});

//Dado una id de estudiante y un trimestre obtiene todas las materias con sus respectivas calificaciones
router.get("/materia/calificaciones", (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        activa: true
      }
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "cXM"
      }
    },
    {
      $unwind: {
        path: "$cXM"
      }
    },
    {
      $lookup: {
        from: "calificacionesXTrimestre",
        localField: "cXM.calificacionesXTrimestre",
        foreignField: "_id",
        as: "cXT"
      }
    },
    {
      $unwind: {
        path: "$cXT"
      }
    },
    {
      $match: {
        "cXT.trimestre": parseInt(req.query.trimestre, 10)
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "cXM.idMateria",
        foreignField: "_id",
        as: "materia"
      }
    },
    {
      $project: {
        "cXT.calificaciones": 1,
        "materia.nombre": 1
      }
    }
  ]).then(resultado => {
    let vectorRespuesta = [];
    resultado.forEach(objEnResultado => {
      vectorRespuesta.push({
        materia: objEnResultado.materia[0].nombre,
        calificaciones: objEnResultado.cXT.calificaciones
      });
    });
    res.status(200).json({
      message: "Operación exitosa",
      exito: true,
      vectorCalXMat: vectorRespuesta
    });
  });
});

router.post("/registrarCalificacionExamen", (req, res) => {
  console.log(req.body);
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.body.idEstudiante)
      }
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "CXM"
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "CXM.idMateria",
        foreignField: "_id",
        as: "nombreCXM"
      }
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "materiasPendientes",
        foreignField: "_id",
        as: "materiasPendientesArray"
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasPendientesArray.idMateria",
        foreignField: "_id",
        as: "materiasPendientesNombres"
      }
    },
    {
      $project: {
        CXM: 1,
        materiasPendientesArray: 1
      }
    }
  ]).then(materias => {

    // recorremos las materias de este año para ver si coincide con la rendida
    // y le asignamos el promedio y estado
    for (i = 0; i < materias[0].CXM.length - 1; i++) {
      if (materias[0].CXM[i].idMateria == req.body.idMateria) {
        Estado.findOne({
          ambito: "CalificacionesXMateria",
          nombre: "Aprobada"
        }).then(async estado => {
          await CalificacionesXMateria.findOne({
            idMateria: req.body.idMateria,
            _id: materias[0].CXM[i]._id
          }).then(async CXMateria => {
            CXMateria.promedio = req.body.calificacion;
            CXMateria.estado = estado._id;
            await CXMateria.save().then(() => {
              return res.status(200).json({
                message: "Se asignó la calificacion del examen exitosamente",
                exito: true
              });
            });
          });
        });
        return;
      }
    }

  if(materias[0].materiasPendientesArray.length != 0){
    let indiceMateriaRendida;
    // recorremos las materias pendientes para ver si coincide con la rendida
      // y le asignamos el promedio y estado
      for (i = 0; i < materias[0].materiasPendientesArray.length - 1; i++) {
        if (materias[0].materiasPendientesArray[i].idMateria == req.body.idMateria) {
          indiceMateriaRendida = i;
          Estado.findOne({
            ambito: "CalificacionesXMateria",
            nombre: "Aprobada"
          }).then(async estado => {
            await CalificacionesXMateria.findOne({
              idMateria: req.body.idMateria,
              _id: materias[0].materiasPendientesArray[i]._id
            }).then(async CXMateria => {
              CXMateria.promedio = req.body.calificacion;
              CXMateria.estado = estado._id;
              await CXMateria.save().then( () => {
                return res.status(200).json({
                  message: "Se asignó la calificacion del examen exitosamente",
                  exito: true
                });
              });
            });
          });
          //Sacamos la materia aprobada del array de materias pendientes
          materias[0].materiasPendientesArray.splice(indiceMateriaRendida,1);
          return;
        }
      }
  }

    return res.status(200).json({
      message: "No se logró asignar la calificacion del examen",
      exito: false
    });
  });
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
        .catch(e => {
          res
            .status(200)
            .json({ message: "Ocurrió un error: " + e, exito: false });
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
        if (
          !(
            fechaHoy.getDate() == ultimaAD.fecha.getDate() &&
            fechaHoy.getMonth() == ultimaAD.fecha.getMonth() &&
            fechaHoy.getFullYear() == ultimaAD.fecha.getFullYear()
          )
        ) {
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

//Se obtienen las ultimas inasistencias dentro de un periodo de 5 dias antes
//Se utiliza para la justificacion de inasistencias
//Se valida que solo se pueda justificar inasistencias para el trimestre actual
router.get("/inasistencias", (req, res) => {
  let fechaActual = new Date();
  let fechaLimiteInferior;
  let fechaLimiteSuperior;

  CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then(
    cicloLectivo => {
      if (
        fechaActual >= cicloLectivo.fechaInicioPrimerTrimestre &&
        fechaActual <= cicloLectivo.fechaFinPrimerTrimestre
      ) {
        fechaLimiteInferior = cicloLectivo.fechaInicioPrimerTrimestre;
        fechaLimiteSuperior = cicloLectivo.fechaFinPrimerTrimestre;
      } else if (
        fechaActual >= cicloLectivo.fechaInicioSegundoTrimestre &&
        fechaActual <= cicloLectivo.fechaFinSegundoTrimestre
      ) {
        fechaLimiteInferior = cicloLectivo.fechaInicioSegundoTrimestre;
        fechaLimiteSuperior = cicloLectivo.fechaFinSegundoTrimestre;
      } else if (
        fechaActual >= cicloLectivo.fechaInicioTercerTrimestre &&
        fechaActual <= cicloLectivo.fechaFinTercerTrimestre
      ) {
        fechaLimiteInferior = cicloLectivo.fechaInicioTercerTrimestre;
        fechaLimiteSuperior = cicloLectivo.fechaFinTercerTrimestre;
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

//Obtiene los tutores de un estudiante
router.get("/tutores", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true
      }
    },
    {
      $lookup: {
        from: "adultoResponsable",
        localField: "adultoResponsable",
        foreignField: "_id",
        as: "datosAR"
      }
    },
    {
      $unwind: {
        path: "$datosAR"
      }
    },
    {
      $match: {
        "datosAR.tutor": true
      }
    },
    {
      $project: {
        "datosAR._id": 1,
        "datosAR.apellido": 1,
        "datosAR.nombre": 1,
        "datosAR.telefono": 1
      }
    }
  ]).then(datosTutores => {
    if (!datosTutores) {
      return res.status(200).json({
        message: "El estudiante no tiene tutores",
        exito: false
      });
    }
    let tutores = [];
    datosTutores.forEach(tutor => {
      tutores.push(tutor.datosAR);
    });
    return res.status(200).json({
      message: "Se obtuvieron los tutores exitosamente",
      exito: true,
      tutores: tutores
    });
  });
});

//Obtiene los adultos responsable de un estudiante
router.get("/adultosResponsables", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true
      }
    },
    {
      $lookup: {
        from: "adultoResponsable",
        localField: "adultoResponsable",
        foreignField: "_id",
        as: "datosAR"
      }
    },
    {
      $project: {
        "datosAR._id": 1,
        "datosAR.apellido": 1,
        "datosAR.nombre": 1,
        "datosAR.telefono": 1,
        "datosAR.email": 1,
        "datosAR.tipoDocumento": 1,
        "datosAR.numeroDocumento": 1
      }
    }
  ]).then(datosAdResp => {
    if (!datosAdResp) {
      return res.status(200).json({
        message: "El estudiante no tiene adultos responsables a su cargo",
        exito: false
      });
    }
    let AR = [];
    datosAdResp[0].datosAR.forEach(AdResp => {
      AR.push(AdResp);
    });
    return res.status(200).json({
      message: "Se obtuvieron los adultos responsables exitosamente",
      exito: true,
      tutores: AR
    });
  });
});

//Prueba notif #resolve #borrar
router.get("/notificacion", (req, res) => {
  Suscripcion.notificar(
    "5d7bfd1b93119f33f80819a1",
    "Titulo",
    "Notificación de prueba."
  );
  res.status(200).json({ message: "Prueba de notificación" });
});

module.exports = router;
