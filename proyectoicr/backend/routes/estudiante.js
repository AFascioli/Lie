const express = require("express");
const Estudiante = require("../models/estudiante");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
//const Suscripcion = require("../classes/suscripcion");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const ClaseEstudiante = require("../classes/estudiante");

//Registra un nuevo estudiante y pone su estado a registrado
router.post("", checkAuthMiddleware, (req, res, next) => {
  Estudiante.findOne({
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
  })
    .then((estudiante) => {
      if (estudiante) {
        res.status(200).json({
          message: "El estudiante ya se encuentra registrado",
          exito: false,
        });
      } else {
        Estado.findOne({
          ambito: "Estudiante",
          nombre: "Registrado",
        })
          .then((estado) => {
            ClaseEstudiante.CrearEstudiante(
              req.body.apellido,
              req.body.nombre,
              req.body.tipoDocumento,
              req.body.numeroDocumento,
              req.body.cuil,
              req.body.sexo,
              req.body.calle,
              req.body.numeroCalle,
              req.body.piso,
              req.body.departamento,
              req.body.provincia,
              req.body.localidad,
              req.body.codigoPostal,
              req.body.nacionalidad,
              req.body.fechaNacimiento,
              req.body.estadoCivil,
              req.body.telefonoFijo,
              [],
              true,
              estado._id
            )
              .then((estudiante) => {
                estudiante
                  .save()
                  .then(() => {
                    res.status(201).json({
                      message: "Estudiante registrado correctamente",
                      exito: true,
                    });
                  })
                  .catch(() =>
                    res.status(500).json({
                      message:
                        "Ocurrió un error al querer guardar en la base de datos a un estudiante",
                      exito: false,
                    })
                  );
              })
              .catch(() => {
                res.status(500).json({
                  message: "Mensaje de error especifico",
                });
              });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico",
            });
          });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

router.get("/id", checkAuthMiddleware, (req, res) => {
  Estudiante.findById(req.query.idEstudiante)
    .then((estudiante) => {
      if (estudiante) {
        res.json({
          estudiante: estudiante,
          exito: true,
          message: "Estudiante encontrado exitosamente",
        });
      } else {
        res.json({
          estudiante: null,
          exito: false,
          message: "Estudiante no registrado",
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Obtiene los adultos responsable de un estudiante
router.get("/adultosResponsables", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true,
      },
    },
    {
      $lookup: {
        from: "adultoResponsable",
        localField: "adultoResponsable",
        foreignField: "_id",
        as: "datosAR",
      },
    },
    {
      $project: {
        "datosAR._id": 1,
        "datosAR.apellido": 1,
        "datosAR.nombre": 1,
        "datosAR.telefono": 1,
        "datosAR.email": 1,
        "datosAR.tipoDocumento": 1,
        "datosAR.numeroDocumento": 1,
      },
    },
  ])
    .then((datosAdResp) => {
      if (!datosAdResp) {
        return res.status(200).json({
          message: "El estudiante no tiene adultos responsables a su cargo",
          exito: false,
        });
      }
      let AR = [];
      datosAdResp[0].datosAR.forEach((AdResp) => {
        AR.push(AdResp);
      });
      return res.status(200).json({
        message: "Se obtuvieron los adultos responsables exitosamente",
        exito: true,
        tutores: AR,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Borrado logico de un estudiante
router.delete("/borrar", checkAuthMiddleware, async(req, res, next) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Activa");
  let idEstadoInactiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Inactiva");
  let idEstadoDeBaja = await ClaseEstado.obtenerIdEstado("Estado", "De baja");
  Estudiante.findOneAndUpdate(
    { _id: req.query._id },
    { activo: false, estado: idEstadoDeBaja }
  ).then(() => {
    Inscripcion.findOne({
      idEstudiante: req.query._id,
      estado: idEstadoActiva,
    }).then((inscripcion) => {
      if (inscripcion) {
        inscripcion.estado = idEstadoInactiva;
        inscripcion.save();
      }
      res.status(202).json({
        message: "Estudiante exitosamente borrado",
        exito: true,
      });
    });
  });
});

//Dada una id de estudiante, se fija si esta inscripto en un curso
router.get("/curso", checkAuthMiddleware, (req, res) => {
  Estudiante.findOne({ _id: req.query.idEstudiante, activo: true })
    .then((estudiante) => {
      Estado.findById(estudiante.estado)
        .then((estado) => {
          if (estado.nombre == "Inscripto") {
            res.status(200).json({
              message:
                "El estudiante seleccionado ya se encuentra inscripto en un curso",
              exito: true,
            });
          } else {
            res.status(200).json({
              message:
                "El estudiante seleccionado no esta inscripto en un curso",
              exito: false,
            });
          }
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico",
          });
        });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Obtiene un estudiante dado un numero y tipo de documento
router.get("/documento", checkAuthMiddleware, (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  Estudiante.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
    activo: true,
  })
    .then((documents) => {
      res.status(200).json({
        estudiantes: documents,
      });
    })
    .catch(() => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el estudiante por documento",
      });
    });
});

//Recibe por parametros un vector de los estudiantes con los respectivos documentos entregados
router.post("/documentos", checkAuthMiddleware, async(req, res) => {
  try {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Activa");
    req.body.forEach((estudiante) => {
      Inscripcion.findOneAndUpdate(
        { idEstudiante: estudiante.idEstudiante, estado: idEstadoActiva },
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
  })
    .then(() => {
      res.status(200).json({
        message: "Estudiante modificado exitosamente",
        exito: true,
      });
    })
    .catch(() => {
      res.status(200).json({
        message: "Ocurrió un problema al intentar modificar el estudiante",
        exito: false,
      });
    });
});

//Busqueda de un estudiante por nombre y apellido ignorando mayusculas
router.get("/nombreyapellido", checkAuthMiddleware, (req, res, next) => {
  const nombre = req.query.nombre;
  const apellido = req.query.apellido;
  Estudiante.find({
    nombre: { $regex: new RegExp(nombre, "i") },
    apellido: { $regex: new RegExp(apellido, "i") },
    activo: true,
  })
    .then((documents) => {
      res.status(200).json({
        estudiantes: documents,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener el estudiante por nombre",
      });
    });
});

//Obtiene los tutores de un estudiante
router.get("/tutores", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true,
      },
    },
    {
      $lookup: {
        from: "adultoResponsable",
        localField: "adultoResponsable",
        foreignField: "_id",
        as: "datosAR",
      },
    },
    {
      $unwind: {
        path: "$datosAR",
      },
    },
    {
      $match: {
        "datosAR.tutor": true,
      },
    },
    {
      $project: {
        "datosAR._id": 1,
        "datosAR.apellido": 1,
        "datosAR.nombre": 1,
        "datosAR.telefono": 1,
      },
    },
  ])
    .then((datosTutores) => {
      if (!datosTutores) {
        return res.status(200).json({
          message: "El estudiante no tiene tutores",
          exito: false,
        });
      }
      let tutores = [];
      datosTutores.forEach((tutor) => {
        tutores.push(tutor.datosAR);
      });
      return res.status(200).json({
        message: "Se obtuvieron los tutores exitosamente",
        exito: true,
        tutores: tutores,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Obtiene todas las cuotas de un estudiante pasado por parámetro
//@params: id del estudiante
router.get("/cuotasEstudiante", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true,
      },
    },
    {
      $lookup: {
        from: "inscripcion",
        localField: "_id",
        foreignField: "idEstudiante",
        as: "InscripcionEstudiante",
      },
    },
    {
      $project: {
        _id: 1,
        InscripcionEstudiante: 1,
      },
    },
  ])
    .then((docs) => {
      let docPosta = [];

      for (let i = 0; i < docs[0].InscripcionEstudiante.length; i++) {
        if (docs[0].InscripcionEstudiante[i].activa == true) {
          docPosta.push(docs[0].InscripcionEstudiante[i]);
        }
      }
      if (docPosta[0].cuotas.length == 0) {
        return res.status(200).json({
          message: "El estudiante no tiene cuotas",
          exito: false,
        });
      }
      let cuo = [];
      docPosta[0].cuotas.forEach((d) => {
        cuo.push([d.mes, d.pagado]);
      });
      return res.status(200).json({
        message: "Se obtuvieron las cuotas exitosamente",
        exito: true,
        cuotas: cuo,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "No se logró obtener las cuotas correctamente",
      });
    });
});

router.get("/sancionesEstudiante", (req, res) => {
  let objetoDate = new Date();
  let añoActual = objetoDate.getFullYear();
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true,
      },
    },
    {
      $lookup: {
        from: "inscripcion",
        localField: "_id",
        foreignField: "idEstudiante",
        as: "InscripcionEstudiante",
      },
    },
    {
      $unwind: {
        path: "$InscripcionEstudiante",
      },
    },
    {
      $match: {
        "InscripcionEstudiante.año": añoActual,
      },
    },
    {
      $project: {
        _id: 1,
        InscripcionEstudiante: 1,
      },
    },
    {
      $unwind: {
        path: "$InscripcionEstudiante",
      },
    },
    {
      $project: {
        _id: 0,
        "InscripcionEstudiante.sanciones": 1,
      },
    },
  ])
    .then((inscripciones) => {
      let sanciones = [];
      if (inscripciones.length > 1) {
        inscripciones.forEach((inscripcion) => {
          sanciones = sanciones.concat(
            inscripcion.InscripcionEstudiante.sanciones
          );
        });
      } else {
        sanciones = inscripciones[0].InscripcionEstudiante.sanciones;
      }

      if (sanciones.length == 0) {
        return res.status(200).json({
          message: "El estudiante no tiene sanciones",
          exito: false,
          sanciones: [],
        });
      } else {
        return res.status(200).json({
          message: "Se obtuvieron las sanciones exitosamente",
          exito: true,
          sanciones: sanciones,
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Obtiene la agenda de un curso (materias, horario y día dictadas)
//@params: idEstudiante
router.get("/agenda", checkAuthMiddleware, async(req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Activa");
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: mongoose.Types.ObjectId(idEstadoActiva),
      },
    },
    {
      $project: {
        idCurso: 1,
      },
    },
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "curso",
      },
    },
    {
      $unwind: {
        path: "$curso",
      },
    },
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "curso.materias",
        foreignField: "_id",
        as: "MXC",
      },
    },
    {
      $unwind: {
        path: "$MXC",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "MXC.idMateria",
        foreignField: "_id",
        as: "nombreMateria",
      },
    },
    {
      $lookup: {
        from: "empleado",
        localField: "MXC.idDocente",
        foreignField: "_id",
        as: "docente",
      },
    },
    {
      $unwind: {
        path: "$MXC.horarios",
      },
    },
    {
      $lookup: {
        from: "horario",
        localField: "MXC.horarios",
        foreignField: "_id",
        as: "horarios",
      },
    },
    {
      $project: {
        "nombreMateria.nombre": 1,
        horarios: 1,
        "docente.nombre": 1,
        "docente.apellido": 1,
      },
    },
  ])
    .then((agendaCompleta) => {
      if (agendaCompleta[0].horarios[0] == null) {
        return res.json({
          exito: false,
          message: "No existen horarios registrados para este curso",
          agenda: [],
        });
      } else {
        let agenda = [];
        for (let i = 0; i < agendaCompleta.length; i++) {
          let valor = {
            nombre: agendaCompleta[i].nombreMateria[0].nombre,
            dia: agendaCompleta[i].horarios[0].dia,
            inicio: agendaCompleta[i].horarios[0].horaInicio,
            fin: agendaCompleta[i].horarios[0].horaFin,
            nombreDocente: agendaCompleta[i].docente[0].nombre,
            apellidoDocente: agendaCompleta[i].docente[0].apellido,
            idHorarios: agendaCompleta[i].horarios[0]._id,
          };
          agenda.push(valor);
        }
        return res.json({
          exito: true,
          message: "Se ha obtenido la agenda correctamente",
          agenda: agenda,
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

router.get("/suspendido", async(req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Activa");
  Inscripcion.findOne({
    idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
    estado: idEstadoActiva,
  })
    .then((inscripcion) => {
      Estado.findOne({
        nombre: "Suspendido",
        ambito: "Inscripcion",
      }).then((estado) => {
        if (inscripcion.estado.toString() == estado._id.toString()) {
          res.status(200).json({
            message: "El estudiante esta suspendido",
            exito: true,
            inscripcion: inscripcion.estado,
            estado: estado._id,
          });
        } else {
          res.status(200).json({
            message: "El estudiante no esta suspendido",
            exito: false,
            inscripcion: inscripcion.estado,
            estado: estado._id,
          });
        }
      });
    })
    .catch(() => {
      res.status(500).json({
        message:
          "Ah ocurrido un error al validar si el estudiante esta suspendido.",
      });
    });
});

router.get("/estado/suspendido", (req, res) => {
  Estado.findOne({
    nombre: "Suspendido",
    ambito: "Inscripcion",
  })
    .then((estado) => {
      if (req.body.idEstado == estado._id.toString()) {
        res.status(200).json({
          message: "El estado es suspendido",
          exito: true,
        });
      } else {
        res.status(200).json({
          message: "El estado no es suspendido",
          exito: false,
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        message:
          "Ah ocurrido un error al validar si el estudiante esta suspendido.",
      });
    });
});

router.get("/reincorporacion", async(req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Activa");
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado("Inscripcion", "Suspendido");
  Inscripcion.findOneAndUpdate(
    { idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante), estado: idEstadoSuspendido },
    {
      estado: idEstadoActiva,
    }
  )
    .then(() => {
      res.status(200).json({
        message: "El estudiante esta reincorporado",
        exito: true,
      });
    })
    .catch(() => {
      res.status(500).json({
        message:
          "Ah ocurrido un error al registrar la reincorporación del estudiante.",
        exito: false,
      });
    });
});

module.exports = router;
