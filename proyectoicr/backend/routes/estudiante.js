const express = require("express");
const Estudiante = require("../models/estudiante");
const Inscripcion = require("../models/inscripcion");
const AdultoResponsable = require("../models/adultoResponsable");
const Division = require("../models/division");
const AsistenciaDiaria = require("../models/asistenciaDiaria");
const Suscripcion = require("../classes/suscripcion");
const router = express.Router();
const mongoose = require("mongoose");

const checkAuthMiddleware = require("../middleware/check-auth");

//Registra un nuevo estudiante en la base de datos
router.post("", checkAuthMiddleware, (req, res, next) => {
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
    adultoResponsable: "null",
    activo: true
  });
  estudiante
    .save()
    .then(() => {
      res.status(201).json({
        message: "Estudiante registrado correctamente!"
      });
    })
    .catch(err => console.log("Error al meter en la bd estudiante" + err));
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
    telefonoFijo: req.body.telefonoFijo,
    adultoResponsable: "null"
  }).then(() => {
    res.status(200).json({
      message: "Estudiante exitosamente modificado"
    });
  });
});

//Borrado logico de un estudiante
router.delete("/borrar", checkAuthMiddleware, (req, res, next) => {
  Estudiante.findOneAndUpdate({ _id: req.query._id }, { activo: false }).then(
    () => {
      res.status(202).json({
        message: "Estudiante exitosamente borrado"
      });
    }
  );
});

//Retorna vector con datos de los estudiantes y presente. Si ya se registro una asistencia para
//el dia de hoy se retorna ese valor de la asistencia, sino se "construye" una nueva
router.get("/asistencia", checkAuthMiddleware, (req, res) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "divisiones",
        localField: "IdDivision",
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
            from: "divisiones",
            localField: "IdDivision",
            foreignField: "_id",
            as: "curso"
          }
        },
        {
          $lookup: {
            from: "estudiantes",
            localField: "IdEstudiante",
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
            from: "divisiones",
            localField: "IdDivision",
            foreignField: "_id",
            as: "curso"
          }
        },
        {
          $lookup: {
            from: "estudiantes",
            localField: "IdEstudiante",
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
      console.log(estudiante);
      var valorInasistencia = 0;
      if (!estudiante.presente) {
        valorInasistencia = 1;
      }
      Inscripcion.findOne({
        IdEstudiante: estudiante._id,
        activa: true
      }).then(async inscripcion => {
        var asistenciaEstudiante = new AsistenciaDiaria({
          IdInscripcion: inscripcion._id,
          fecha: estudiante.fecha,
          presente: estudiante.presente,
          valorInasistencia: valorInasistencia,
          justificado: false
        });

        await asistenciaEstudiante.save().then(async asistenciaDiaria => {
          await inscripcion.asistenciaDiaria.push(asistenciaDiaria._id);

          console.log(inscripcion);
          inscripcion.contadorInasistencias =
            inscripcion.contadorInasistencias + valorInasistencia;
          inscripcion.save();
        });
      });
    });
  } else {
    req.body.forEach(estudiante => {
      AsistenciaDiaria.findByIdAndUpdate(estudiante.idAsistencia, {
        presente: estudiante.presente
      }).exec();
      if (!estudiante.presente) {
        Inscripcion.findOneAndUpdate(
          {
            IdEstudiante: estudiante._id,
            activa: true
          },
          { contadorInasistencias: contadorInasistencias + 1 }
        ).exec();
      }
    });
  }
  Suscripcion.notificarAll(["5d7bfd1b93119f33f80819a1", "5d7bfd1b93119f33f80819a3"],"Asistencia", "El estudiante está presente.");
  res.status(201).json({ message: "Asistencia registrada exitósamente" });
});

//Obtiene la id de la asistencia diaria del dia de hoy, y cambia los valores correspondientes en la coleccion de asistencia diaria
router.post("/retiro", checkAuthMiddleware, (req, res) => {
  Inscripcion.findOne(
    { IdEstudiante: req.body.IdEstudiante, activa: true },
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
                  res.status(200).json({
                    message: "Retiro anticipado exitósamente registrado",
                    exito: "exito"
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

//Este metodo filtra las inscripciones por estudiante y retorna el contador de inasistencias
//de dicho estudiante
router.get("/asistenciaEstudiante", (req, res) => {
  Inscripcion.findOne({ IdEstudiante: req.query.idEstudiante }).then(
    estudiante => {
      res.status(200).json({
        message: "Operacion exitosa",
        exito: true,
        contadorInasistencias: estudiante.contadorInasistencias,
        contadorInasistenciasJustificada:
          estudiante.contadorInasistenciasJustificada
      });
    }
  );
});

//Vamos a recibir, un vector de los estudiantes a los que se le modificaron los documentos entregados.
router.post("/documentos", checkAuthMiddleware, (req, res) => {
  try {
    req.body.forEach(estudiante => {
      Inscripcion.findOneAndUpdate(
        { IdEstudiante: estudiante.IdEstudiante, activa: true },
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

//Dado una id de estudiante y un trimestre obtiene todas las materias con sus respectivas calificaciones
router.get("/calif/materia", (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        IdEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
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
      $match: {
        "cXM.trimestre": parseInt(req.query.trimestre, 10)
      }
    },
    {
      $lookup: {
        from: "materias",
        localField: "cXM.idMateria",
        foreignField: "_id",
        as: "materia"
      }
    },
    {
      $project: {
        "cXM.calificaciones": 1,
        "materia.nombre": 1
      }
    }
  ]).then(resultado => {
    let vectorRespuesta = [];
    resultado.forEach(objEnResultado => {
      vectorRespuesta.push({
        materia: objEnResultado.materia[0].nombre,
        calificaciones: objEnResultado.cXM.calificaciones
      });
    });

    res.status(200).json({
      message: "Operación exitosa",
      exito: true,
      vectorCalXMat: vectorRespuesta
    });
  });
});

//Primero, las fechas del backend estan adelantadas por 3 hrs, se corrige eso. Luego se realiza
//la consulta y segun sea multiple justificacion o no realiza las operaciones correspondientes
//Nota: no deja justificar si el alumno estuvo presente para la fecha o si ya fue
//justificada la asistencia para ese dia
router.get("/inasistencia/justificada", (req, res) => {
  let fechaInicio = new Date(req.query.fechaInicio);
  let fechaFin = new Date(req.query.fechaFin);
  fechaInicio.setHours(fechaInicio.getHours() - 3);
  fechaFin.setHours(fechaFin.getHours() - 3);
  //5d1a5a66941efc2e98b15c0e id del estudiante que tiene los datos bien
  Inscripcion.aggregate([
    {
      $match: {
        IdEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        activa: true
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
        "presentismo.fecha": {
          $gte: fechaInicio,
          $lt: fechaFin
        }
      }
    },
    {
      $project: {
        "presentismo._id": 1,
        "presentismo.presente": 1,
        "presentismo.justificado": 1
      }
    }
  ]).then(resultado => {
    //5d2e30dd32a43405043e76c6 id de la asistencia que retorna
    console.log(JSON.stringify(resultado));
    if (req.query.esMultiple == "true") {
      resultado[0].presentismo.forEach(async asistenciaDiaria => {
        if (
          !resultado[0].presentismo[0].presente &&
          !resultado[0].presentismo[0].justificado
        ) {
          let idAsistencia = asistenciaDiaria._id;
          await AsistenciaDiaria.findByIdAndUpdate(idAsistencia, {
            justificado: true
          }).exec();
          Inscripcion.findByIdAndUpdate(resultado[0]._id, {
            contadorInasistenciasJustificada:
              contadorInasistenciasJustificada + 1,
            contadorInasistencias: contadorInasistencias - 1
          }).exec();
        }
      });
      res.status(200).json({
        message: "Inasistencias justificadas exitosamente",
        exito: true
      });
    } else {
      if (resultado[0].presentismo[0].presente) {
        return res.status(200).json({
          message: "El estudiante estuvo presente para la fecha ingresada",
          exito: false
        });
      } else if (resultado[0].presentismo[0].justificado) {
        return res.status(200).json({
          message: "El estudiante ya tiene justificada la inasistencia",
          exito: false
        });
      } else {
        let idAsistencia = resultado[0].presentismo[0]._id;
        AsistenciaDiaria.findByIdAndUpdate(idAsistencia, {
          justificado: true
        }).then(() => {
          res.json({
            message: "Asistencia exitosamente justificada",
            exito: true
          });
        });
      }
    }
  });
});

router.get("/tutores", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId("5d0ee07c489bdd0830bd1d0d"),
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

//Prueba notif #resolve #borrar
router.get("/notificacion", (req, res) => {
  Suscripcion.notificar(
    "5d7bfd1b93119f33f80819a1",
    "Titulo",
    "Notificación de prueba."
  );
  //Suscripcion.notificarAll(["5d7bfd1b93119f33f80819a1", "5d7bfd1b93119f33f80819a3"],"Título de prueba", "Contenido de prueba.");
  res.status(200).json({ message: "Prueba de notificación" });
});

module.exports = router;
