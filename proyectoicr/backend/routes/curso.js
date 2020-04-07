const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const Curso = require("../models/curso");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
//const CalificacionesXMateria = require("../models/calificacionesXMateria");
const Estudiante = require("../models/estudiante");
//const Cuota = require("../models/inscripcion");
const Horario = require("../models/horario");
const MateriaXCurso = require("../models/materiasXCurso");
const ClaseInscripcion = require("../classes/inscripcion");
const ClaseCalifXMateria = require("../classes/calificacionXMateria");
const AdultoResponsable = require("../models/adultoResponsable");
const Suscripcion = require("../classes/suscripcion");
const ClaseAsistencia = require("../classes/asistencia");

// Obtiene todos los cursos que están almacenados en la base de datos
router.get("/", checkAuthMiddleware, (req, res) => {
  Curso.find()
    .select({ curso: 1, _id: 1 })
    .then(cursos => {
      var respuesta = [];
      cursos.forEach(curso => {
        var cursoConId = {
          id: curso._id,
          curso: curso.curso
        };
        respuesta.push(cursoConId);
      });
      res.status(200).json({ cursos: respuesta });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

notificarSancion = async function(idEstudiante) {
  titulo = "Nueva sanción.";
  await Estudiante.findById(idEstudiante).then(estudiante => {
    cuerpo = `Se le ha registrado una nueva sanción a ${estudiante.apellido} ${estudiante.nombre}.`;
  });

  AdultoResponsable.aggregate([
    {
      $match: {
        estudiantes: mongoose.Types.ObjectId(idEstudiante)
      }
    },
    {
      $lookup: {
        from: "usuario",
        localField: "idUsuario",
        foreignField: "_id",
        as: "usuario"
      }
    },
    {
      $unwind: {
        path: "$usuario"
      }
    },
    {
      $project: {
        "usuario._id": 1,
        _id: 0
      }
    }
  ]).then(respuesta => {
    let idsUsuario = [];
    for (let index = 0; index < respuesta.length; index++) {
      idsUsuario.push(respuesta[index].usuario._id);
    }
    Suscripcion.notificacionGrupal(idsUsuario, titulo, cuerpo);
  });
};

//Registra una nueva sancion de un estudiante en particular si es que no hay una ya registrada
//Si hay una registrada, solo actualiza la cantidad
//@params: idEstudiante
//@params: tipo (sancion)
//@params: cantidad (sancion)
//@params: fecha (sancion)
router.post("/registrarSancion", checkAuthMiddleware, (req, res) => {
  let modificarSancion = false;
  let indice = 0;
  Inscripcion.findOne({
    idEstudiante: req.body.idEstudiante,
    activa: true
  }).then(inscripcion => {
    for (let index = 0; index < inscripcion.sanciones.length; index++) {
      if (
        ClaseAsistencia.esFechaActual(inscripcion.sanciones[index].fecha) &&
        inscripcion.sanciones[index].tipo == req.body.tipoSancion
      ) {
        modificarSancion = true;
        indice = index;
      }
    }
    if (!modificarSancion) {
      Inscripcion.findOneAndUpdate(
        {
          idEstudiante: req.body.idEstudiante,
          activa: true
        },
        {
          $push: {
            sanciones: {
              tipo: req.body.tipoSancion,
              cantidad: req.body.cantidad,
              fecha: req.body.fecha
            }
          }
        }
      )
        .then(
          res.status(200).json({
            message: "Se ha registrado la sanción del estudiante correctamente",
            exito: true
          })
        )
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    } else {
      inscripcion.sanciones[indice].cantidad += req.body.cantidad;
      inscripcion
        .save()
        .then(() => {
          notificarSancion(req.body.idEstudiante);
          res.status(200).json({
            message: "Se ha registrado la sanción del estudiante correctamente",
            exito: true
          });
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    }
  });
});

//Obtiene el estado de las cuotas de todos los estudiantes de un curso
//@params: id del curso
//@params: mes de la cuota
router.get("/estadoCuotas", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  // let añoActual = fechaActual.getFullYear();
  Curso.findOne({ curso: req.query.idCurso })
    .then(curso => {
      Inscripcion.aggregate([
        {
          $unwind: {
            path: "$cuotas"
          }
        },
        {
          $match: {
            activa: true,
            idCurso: mongoose.Types.ObjectId(curso._id),
            "cuotas.mes": parseInt(req.query.mes, 10)
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
          $project: {
            "estudiante.apellido": 1,
            "estudiante.nombre": 1,
            cuotas: 1
          }
        }
      ])
        .then(estadoCuotas => {
          if (estadoCuotas.length == 0) {
            res.status(200).json({
              message: "No se han obtenido alumnos de dicho curso",
              exito: true
            });
          } else {
            cuotasXEstudiantes = [];
            let cuotaXEstudiante;
            final = estadoCuotas.length - 1;
            for (let i = 0; i <= final; i++) {
              if (i <= estadoCuotas.length - 1) {
                cuotaXEstudiante = {
                  _id: estadoCuotas[i]._id,
                  apellido: estadoCuotas[i].estudiante[0].apellido,
                  nombre: estadoCuotas[i].estudiante[0].nombre,
                  pagado: estadoCuotas[i].cuotas.pagado,
                  mes: estadoCuotas[i].cuotas.mes
                };
                cuotasXEstudiantes.push(cuotaXEstudiante);
              }
            }
            res.status(200).json({
              message:
                "Se ha obtenido el estado de las cuotas de un curso exitosamente",
              exito: true,
              cuotasXEstudiante: cuotasXEstudiantes
            });
          }
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Publica el estado de las cuotas de todos los estudiantes de un curso
//@params: id de la inscripcion, mes de la cuota, estado cuota (pagada o no) y nombre y apellido
router.post("/publicarEstadoCuotas", checkAuthMiddleware, (req, res) => {
  final = req.body.length - 1;
  for (let i = 0; i <= final; i++) {
    Inscripcion.findById(req.body[i]._id)
      .then(inscripcion => {
        inscripcion.cuotas[req.body[i].mes - 1].pagado = !inscripcion.cuotas[
          req.body[i].mes - 1
        ].pagado;
        inscripcion.save();
      })
      .catch(() => {
        res.status(500).json({
          message: "Mensaje de error especifico"
        });
      });
  }
  res.status(200).json({
    message:
      "Se ha registrado el estado de las cuotas de un curso de manera exitosa",
    exito: true
  });
});

// Obtiene la capacidad de un curso pasado por parámetro
// @params: id del curso
router.get("/capacidad", checkAuthMiddleware, (req, res) => {
  Curso.findById(req.query.idCurso)
    .then(curso => {
      res.status(200).json({
        message: "Operación exitosa",
        exito: true,
        capacidad: curso.capacidad
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Obtiene los cursos a los que se puede inscribir un estudiante de acuerdo al estado actual (promovido o libre)
// o devuelve todos en el caso de que no este inscripto a ningun curso
// @params: id del estudiante
router.get("/cursosDeEstudiante", checkAuthMiddleware, (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante)
      }
    },
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "cursoActual"
      }
    },
    {
      $lookup: {
        from: "estado",
        localField: "estado",
        foreignField: "_id",
        as: "estadoInscripcion"
      }
    },
    {
      $project: {
        estadoInscripcion: 1,
        "cursoActual.curso": 1
      }
    }
  ])
    .then(inscripcion => {
      if (inscripcion.length != 0) {
        //El estudiante está inscripto a un curso y por ende se fija al curso al que se puede inscribir
        let siguiente;
        siguiente = ClaseInscripcion.obtenerAñoHabilitado(inscripcion);

        //Buscamos los cursos que corresponden al que se puede inscribir el estudiante
        Curso.find({ curso: { $regex: siguiente } }).then(cursos => {
          return res.status(200).json({
            message: "Devolvio los cursos correctamente",
            exito: true,
            cursos: cursos
          });
        });
      } else {
        //El estudiante no está inscripto a ningun curso, devuelve todos los cursos almacenados
        Curso.find()
          .select({ curso: 1, _id: 1 })
          .then(cursos => {
            var respuesta = [];
            cursos.forEach(curso => {
              var cursoConId = {
                _id: curso._id,
                curso: curso.curso
              };
              respuesta.push(cursoConId);
            });
            return res.status(200).json({
              message: "Devolvio los cursos correctamente",
              exito: true,
              cursos: respuesta
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico"
            });
          });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Obtiene todos los cursos asignados a un docente
//@params: id de la docente
router.get("/docente", checkAuthMiddleware, (req, res) => {
  Curso.aggregate([
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "materias",
        foreignField: "_id",
        as: "mxc"
      }
    },
    {
      $match: {
        "mxc.idDocente": mongoose.Types.ObjectId(req.query.idDocente)
      }
    }
  ])
    .then(cursos => {
      var respuesta = [];
      cursos.forEach(curso => {
        var cursoConId = {
          id: curso._id,
          curso: curso.curso
        };
        respuesta.push(cursoConId);
      });

      res.status(200).json({
        cursos: respuesta,
        message: "Se devolvio los cursos que dicta la docente correctamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Obtiene los documentos con su estado de entrega (true en el caso de que fue entregado) de los estudiantes de un curso dado
//@params: id del curso
router.get("/documentos", checkAuthMiddleware, (req, res) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "cursos"
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
        "cursos.curso": req.query.curso
      }
    },
    {
      $project: {
        _id: 0,
        idEstudiante: 1,
        documentosEntregados: 1,
        "datosEstudiante.apellido": 1,
        "datosEstudiante.nombre": 1
      }
    }
  ])
    .then(estudiantes => {
      res.status(200).json({
        documentos: estudiantes,
        message:
          "Se devolvieron los documentos junto con su estado de entrega correctamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Obtiene las calificaciones de los estudiantes para un trimestre dado un curso y una materia
//@params: id del curso
//@params: id de la materia
//@params: trimestre
router.get(
  "/estudiantes/materias/calificaciones",
  checkAuthMiddleware,
  (req, res) => {
    Inscripcion.aggregate([
      {
        $lookup: {
          from: "estudiante",
          localField: "idEstudiante",
          foreignField: "_id",
          as: "datosEstudiante"
        }
      },
      {
        $project: {
          "datosEstudiante._id": 1,
          "datosEstudiante.nombre": 1,
          "datosEstudiante.apellido": 1,
          activa: 1,
          idCurso: 1,
          calificacionesXMateria: 1
        }
      },
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
          "curso._id": mongoose.Types.ObjectId(req.query.idCurso),
          activa: true
        }
      },
      {
        $project: {
          "datosEstudiante._id": 1,
          "datosEstudiante.nombre": 1,
          "datosEstudiante.apellido": 1,
          "curso.curso": 1,
          calificacionesXMateria: 1
        }
      },
      {
        $unwind: {
          path: "$calificacionesXMateria"
        }
      },
      {
        $lookup: {
          from: "calificacionesXMateria",
          localField: "calificacionesXMateria",
          foreignField: "_id",
          as: "calXMateria"
        }
      },
      {
        $match: {
          "calXMateria.idMateria": mongoose.Types.ObjectId(req.query.idMateria)
        }
      },
      {
        $unwind: {
          path: "$calXMateria"
        }
      },
      {
        $unwind: {
          path: "$calXMateria.calificacionesXTrimestre"
        }
      },
      {
        $lookup: {
          from: "calificacionesXTrimestre",
          localField: "calXMateria.calificacionesXTrimestre",
          foreignField: "_id",
          as: "notasXTrimestre"
        }
      },
      {
        $match: {
          "notasXTrimestre.trimestre": parseInt(req.query.trimestre, 10)
        }
      },
      {
        $project: {
          "datosEstudiante._id": 1,
          "datosEstudiante.nombre": 1,
          "datosEstudiante.apellido": 1,
          "notasXTrimestre.calificaciones": 1
        }
      }
    ])
      .then(documentos => {
        var respuesta = [];
        documentos.forEach(califEst => {
          var calificacionesEstudiante = {
            idEstudiante: califEst.datosEstudiante[0]._id,
            apellido: califEst.datosEstudiante[0].apellido,
            nombre: califEst.datosEstudiante[0].nombre,
            calificaciones: califEst.notasXTrimestre[0].calificaciones
          };
          respuesta.push(calificacionesEstudiante);
        });

        res.status(200).json({
          estudiantes: respuesta,
          message:
            "Se obtuvieron las calificaciones para una materia, un curso y un trimestre determinado correctamente",
          exito: true
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "Mensaje de error especifico"
        });
      });
  }
);

//Obtiene el curso al que está inscripto un estudiante
//@params: id del estudiante
router.get("/estudiante", checkAuthMiddleware, (req, res) => {
  Inscripcion.findOne({
    idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
    activa: true
  }).then(inscripcion => {
    if (inscripcion) {
      Inscripcion.aggregate([
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
            activa: true
          }
        },
        {
          $lookup: {
            from: "curso",
            localField: "idCurso",
            foreignField: "_id",
            as: "cursosDeEstudiante"
          }
        },
        {
          $project: {
            _id: 0,
            "cursosDeEstudiante.curso": 1,
            "cursosDeEstudiante._id": 1
          }
        }
      ])
        .then(cursoDeEstudiante => {
          return res.status(200).json({
            message: "Se obtuvo el curso del estudiante exitosamente",
            exito: true,
            curso: cursoDeEstudiante[0].cursosDeEstudiante[0].curso,
            idCurso: cursoDeEstudiante[0].cursosDeEstudiante[0]._id
          });
        })
        .catch(() => {
          res.status(500).json({
            message:
              "Ocurrieron errores al querer obtener el curso del estudiante: ",
            exito: false
          });
        });
    } else {
      return res.status(200).json({
        message: "El estudiante no esta inscripto",
        exito: false
      });
    }
  });
});

//Obtiene las materias de un curso que se pasa por parametro
//@params: id del curso
router.get("/materiasDeCurso", checkAuthMiddleware, (req, res) => {
  Curso.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idCurso)
      }
    },
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "materias",
        foreignField: "_id",
        as: "materiasDeCurso"
      }
    },
    {
      $project: {
        "materiasDeCurso.materia": 1,
        _id: 0
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasDeCurso.materia",
        foreignField: "_id",
        as: "materias"
      }
    },
    {
      $project: {
        materias: 1
      }
    }
  ])
    .then(rtdoMaterias => {
      var respuesta = [];
      rtdoMaterias[0].materias.forEach(materia => {
        var datosMateria = {
          id: materia._id,
          nombre: materia.nombre
        };
        respuesta.push(datosMateria);
      });
      res.status(200).json({
        materias: respuesta,
        message: "Se obtieron exitosamente las materias de un curso",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Obtiene todas las materias que son dictadas por una docente en un curso determinado
//@params: id de la docente
//@params: id del curso
router.get("/materias", checkAuthMiddleware, (req, res) => {
  Curso.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idCurso)
      }
    },
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "materias",
        foreignField: "_id",
        as: "materiasDeCurso"
      }
    },
    {
      $project: {
        "materiasDeCurso.materia": 1,
        "materiasDeCurso.idDocente": 1,
        _id: 0
      }
    },
    {
      $unwind: {
        path: "$materiasDeCurso"
      }
    },
    {
      $match: {
        "materiasDeCurso.idDocente": mongoose.Types.ObjectId(
          req.query.idDocente
        )
      }
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasDeCurso.materia",
        foreignField: "_id",
        as: "materias"
      }
    },
    {
      $project: {
        materias: 1
      }
    }
  ])
    .then(rtdoMaterias => {
      var respuesta = [];
      rtdoMaterias.forEach(materia => {
        var datosMateria = {
          id: materia.materias[0]._id,
          nombre: materia.materias[0].nombre
        };
        respuesta.push(datosMateria);
      });
      res.status(200).json({
        materias: respuesta,
        message:
          "Se obtuvieron todas las materias que son dictadas por un docente para un curso exitosamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//router.get("/estadoCuotas", checkAuthMiddleware, (req, res) => {});

//Inscribe a un estudiante a un curso y los documentos entregados durante la inscripción
//@params: id estudiante que se quiere inscribir
//@params: id curso al que se lo quiere inscribir
//@params: array documentos entregados en inscripcion: true si se entregó ese documente
router.post("/inscripciontest", checkAuthMiddleware, async (req, res) => {
  //Dado una id de curso, encuentra todos los datos del mismo
  var obtenerCurso = () => {
    return new Promise((resolve, reject) => {
      Curso.findOne({ _id: req.body.idCurso }).then(curso => {
        resolve(curso);
      });
    });
  };

  var obtenerEstadoInscriptoInscripcion = () => {
    return new Promise((resolve, reject) => {
      Estado.findOne({
        nombre: "Inscripto",
        ambito: "Inscripcion"
      })
        .then(estado => {
          resolve(estado);
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    });
  };

  var obtenerInscripcion = () => {
    return new Promise((resolve, reject) => {
      Inscripcion.findOne({
        idEstudiante: req.body.idEstudiante,
        activa: true
      })
        .then(inscripcion => {
          resolve(inscripcion);
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    });
  };

  var obtenerEstadoDesaprobadaMateria = () => {
    return new Promise((resolve, reject) => {
      Estado.findOne({
        nombre: "Desaprobada",
        ambito: "CalificacionesXMateria"
      })
        .then(estado => {
          resolve(estado);
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    });
  };

  var obtenerEstadoCursandoMateria = () => {
    return new Promise((resolve, reject) => {
      Estado.findOne({
        nombre: "Cursando",
        ambito: "CalificacionesXMateria"
      })
        .then(estado => {
          resolve(estado);
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    });
  };

  //Dada una id de curso, obtiene las ids de las materias que se dan en ese curso
  var obtenerMateriasDeCurso = () => {
    return new Promise((resolve, reject) => {
      Curso.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.body.idCurso)
          }
        },
        {
          $unwind: "$materias"
        },
        {
          $lookup: {
            from: "materiasXCurso",
            localField: "materias",
            foreignField: "_id",
            as: "materiasDelCurso"
          }
        },
        {
          $project: {
            "materiasDelCurso.materia": 1,
            _id: 0
          }
        }
      ])
        .then(materiasDelCurso => {
          resolve(materiasDelCurso);
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    });
  };

  var cearCuotas = () => {
    return new Promise((resolve, reject) => {
      cuotas = [];

      for (var i = 0; i < 12; i++) {
        let cuota = { mes: i + 1, pagado: false };
        cuotas.push(cuota);
      }
      resolve(cuotas);
    });
  };

  var cursoSeleccionado = await obtenerCurso();
  var estadoInscriptoInscripcion = await obtenerEstadoInscriptoInscripcion();
  var inscripcion = await obtenerInscripcion();

  //Si el estudiante tiene una inscripcion anteriormente, se obtienen las CXM que esten desaprobadas,
  //ya sea las que estan en materiasPendientes y las CXM con estado "Desaprobada"
  var materiasPendientesNuevas = [];
  if (inscripcion != null) {
    inscripcion.activa = false;
    var estadoDesaprobadaMateria = await obtenerEstadoDesaprobadaMateria();
    if (inscripcion.materiasPendientes.length != 0) {
      //Revisar logica
      materiasPendientesNuevas.push(...inscripcion.materiasPendientes);
    }
    var idsCXMDesaprobadas = await ClaseCalifXMateria.obtenerMateriasDesaprobadasv2(
      inscripcion.calificacionesXMateria,
      estadoDesaprobadaMateria._id
    );
    if (idsCXMDesaprobadas.length != 0) {
      materiasPendientesNuevas.push(...idsCXMDesaprobadas);
    }
    await inscripcion.save();
  }

  var materiasDelCurso = await obtenerMateriasDeCurso();
  var cuotas = await cearCuotas();
  var estadoCursandoMateria = await obtenerEstadoCursandoMateria();
  var idsCXMNuevas = await ClaseCalifXMateria.crearCXM(
    materiasDelCurso,
    estadoCursandoMateria._id
  );

  const nuevaInscripcion = new Inscripcion({
    idEstudiante: req.body.idEstudiante,
    idCurso: cursoSeleccionado._id,
    documentosEntregados: req.body.documentosEntregados,
    activa: true,
    estado: estadoInscriptoInscripcion._id,
    contadorInasistenciasInjustificada: 0,
    contadorInasistenciasJustificada: 0,
    contadorLlegadasTarde: 0,
    calificacionesXMateria: idsCXMNuevas,
    materiasPendientes: materiasPendientesNuevas,
    año: 2019,
    cuotas: cuotas,
    sanciones: []
  });

  nuevaInscripcion
    .save()
    .then(() => {
      cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
      cursoSeleccionado.save();
      //Le cambiamos el estado al estudiante
      Estado.findOne({
        nombre: "Inscripto",
        ambito: "Estudiante"
      })
        .then(async estadoEstudiante => {
          await Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
            estado: estadoEstudiante._id
          })
            .then(async () => {
              await res.status(201).json({
                message: "Estudiante inscripto exitosamente",
                exito: true
              });
            })
            .catch(() => {
              res.status(500).json({
                message: "Mensaje de error especifico"
              });
            });
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Registra las calificaciones todos los estudiantes de un curso para una materia
//y un trimestre determinado en la base de datos
//@params: id de la materia
//@params: trimestre (1,2 o 3)
router.post(
  "/estudiantes/materias/calificaciones",
  checkAuthMiddleware,
  (req, res) => {
    req.body.forEach(estudiante => {
      Inscripcion.aggregate([
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(estudiante.idEstudiante)
          }
        },
        {
          $lookup: {
            from: "calificacionesXMateria",
            localField: "calificacionesXMateria",
            foreignField: "_id",
            as: "calXMatEstudiante"
          }
        },
        {
          $unwind: {
            path: "$calXMatEstudiante"
          }
        },
        {
          $match: {
            "calXMatEstudiante.idMateria": mongoose.Types.ObjectId(
              req.query.idMateria
            )
          }
        },
        {
          $lookup: {
            from: "calificacionesXTrimestre",
            localField: "calXMatEstudiante.calificacionesXTrimestre",
            foreignField: "_id",
            as: "calXTrimestre"
          }
        },
        {
          $unwind: {
            path: "$calXTrimestre"
          }
        },
        {
          $match: {
            "calXTrimestre.trimestre": parseInt(req.query.trimestre, 10)
          }
        },
        {
          $project: {
            "calXTrimestre.calificaciones": 1,
            "calXTrimestre._id": 1
          }
        }
      ])
        .then(resultado => {
          CalificacionesXTrimestre.findByIdAndUpdate(
            resultado[0].calXTrimestre._id,
            {
              $set: {
                calificaciones: estudiante.calificaciones
              }
            }
          )
            .exec()
            .catch(e => console.log(e));
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    });
    res.json({
      message: "Calificaciones registradas correctamente",
      exito: true
    });
  }
);

//Obtiene la agenda de un curso (materias, horario y día dictadas)
//@params: idCurso
router.get("/agenda", checkAuthMiddleware, (req, res) => {
  Curso.findById(req.query.idCurso).then(curso => {
    if (curso.materias.length != 0) {
      Curso.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.query.idCurso)
          }
        },
        {
          $lookup: {
            from: "materiasXCurso",
            localField: "materias",
            foreignField: "_id",
            as: "MXC"
          }
        },
        {
          $unwind: {
            path: "$MXC"
          }
        },
        {
          $lookup: {
            from: "materia",
            localField: "MXC.materia",
            foreignField: "_id",
            as: "nombreMateria"
          }
        },
        {
          $lookup: {
            from: "empleado",
            localField: "MXC.idDocente",
            foreignField: "_id",
            as: "docente"
          }
        },
        {
          $unwind: {
            path: "$MXC.horarios"
          }
        },
        {
          $lookup: {
            from: "horario",
            localField: "MXC.horarios",
            foreignField: "_id",
            as: "horarios"
          }
        },
        {
          $project: {
            "nombreMateria.nombre": 1,
            "nombreMateria._id": 1,
            horarios: 1,
            "docente.nombre": 1,
            "docente.apellido": 1,
            "docente._id": 1,
            "MXC._id": 1
          }
        }
      ])
        .then(agendaCompleta => {
          if (agendaCompleta[0].horarios[0] == null) {
            return res.json({
              exito: false,
              message: "No existen horarios registrados para este curso",
              agenda: []
            });
          } else {
            let agenda = [];
            for (let i = 0; i < agendaCompleta.length; i++) {
              let valor = {
                nombre: agendaCompleta[i].nombreMateria[0].nombre,
                idMXC: agendaCompleta[i].MXC._id,
                dia: agendaCompleta[i].horarios[0].dia,
                inicio: agendaCompleta[i].horarios[0].horaInicio,
                fin: agendaCompleta[i].horarios[0].horaFin,
                idDocente: agendaCompleta[i].docente[0]._id,
                idMateria: agendaCompleta[i].nombreMateria[0]._id,
                idHorarios: agendaCompleta[i].horarios[0]._id,
                modificado: false
              };
              agenda.push(valor);
            }
            res.json({
              exito: true,
              message: "Se ha obtenido la agenda correctamente",
              agenda: agenda
            });
          }
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico"
          });
        });
    } else {
      res.json({
        exito: true,
        message: "Se ha obtenido la agenda correctamente",
        agenda: []
      });
    }
  });
});

//Recibimos : idCXM, idHorarios,
router.post("/modificarAgenda", checkAuthMiddleware, (req, res) => {});

//Elimina un horario para un curso y una materia
//@params: agenda, que se usa solo idHorario y la idMXC
//@params: idCurso
router.post("/eliminarHorario", checkAuthMiddleware, (req, res) => {
  Horario.findByIdAndDelete(req.body.agenda.idHorarios)
    .then(() => {
      MateriaXCurso.findByIdAndDelete(req.body.agenda.idMXC).then(() => {
        Curso.findByIdAndUpdate(req.body.idCurso, {
          $pull: { materias: { $in: req.body.agenda.idMXC } }
        }).then(() => {
          res.json({ exito: true, message: "Horario borrado exitosamente" });
        });
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Se fija cada objeto del vector agenda, si es una mxc nueva la registra
//para un curso dado, sino se modifica el horario de la mxc existente.
//@params: id del curso
//@params: agenda, que es un vector que tiene objetos con idMateria, idDocente, modificado  y el vector de horarios
router.post("/agenda", checkAuthMiddleware, async (req, res) => {
  var crearHorario = horario => {
    return new Promise((resolve, reject) => {
      horario.save().then(horarioGuardado => {
        resolve(horarioGuardado._id);
      });
    });
  };

  var crearMateriaXCurso = mxc => {
    return new Promise((resolve, reject) => {
      mxc.save().then(mxcGuardada => {
        resolve(mxcGuardada._id);
      });
    });
  };
  var mxcNuevas = [];
  let vectorIdsMXC = [];
  for (const materia of req.body.agenda) {
    //Recorrer agenda del front
    if (materia.idHorarios == null) {
      //vemos si la mxc es nueva o una modificada
      if (mxcNuevas.length != 0) {
        for (const mxcNueva of mxcNuevas) {
          //Recorrer mxcNuevas para saber si es una mxc nueva o es una ya creada que tiene un nuevo horario
          if (mxcNueva.idMateria == materia.idMateria) {
            mxcNueva.horarios.push({
              dia: materia.dia,
              inicio: materia.inicio,
              fin: materia.fin
            });
          } else {
            mxcNuevas.push({
              idMateria: materia.idMateria,
              idDocente: materia.idDocente,
              horarios: [
                { dia: materia.dia, inicio: materia.inicio, fin: materia.fin }
              ]
            });
          }
        }
      } else {
        mxcNuevas.push({
          idMateria: materia.idMateria,
          idDocente: materia.idDocente,
          horarios: [
            { dia: materia.dia, inicio: materia.inicio, fin: materia.fin }
          ]
        });
      }
    } else if (materia.modificado) {
      //Se actualiza el nuevo horario para una mxc dada
      Horario.findByIdAndUpdate(materia.idHorarios, {
        dia: materia.dia,
        horaInicio: materia.inicio,
        horaFin: materia.fin
      }).exec();
    }
  }

  if (mxcNuevas.length != 0) {
    //Hay mxc nuevas para guarda en la bd
    for (const mxcNueva of mxcNuevas) {
      let vectorIdsHorarios = [];
      for (const horario of mxcNueva.horarios) {
        let nuevoHorario = new Horario({
          dia: horario.dia,
          horaInicio: horario.inicio,
          horaFin: horario.fin
        });
        let idHorarioGuardado = await crearHorario(nuevoHorario);
        vectorIdsHorarios.push(idHorarioGuardado);
      }
      let nuevaMateriaXCurso = new MateriaXCurso({
        materia: mxcNueva.idMateria,
        idDocente: mxcNueva.idDocente,
        horarios: vectorIdsHorarios
      });

      let idMXC = await crearMateriaXCurso(nuevaMateriaXCurso);
      vectorIdsMXC.push(idMXC);
    }
    Curso.findByIdAndUpdate(req.body.idCurso, {
      $push: { materias: { $each: vectorIdsMXC } }
    }).then(curso => {
      res.json({ exito: true, message: "Materias agregadas correctamente" });
    });
  } else {
    res.json({ exito: true, message: "Horarios modificados correctamente" });
  }
});

//Se fija cada objeto del vector agenda, si es una mxc nueva la registra
//para un curso dado, sino se modifica el horario de la mxc existente.
//@params: id del curso
//@params: agenda, que es un vector que tiene objetos con idMateria, idDocente, modificado  y el vector de horarios
router.post("/agendaTEST", checkAuthMiddleware, async (req, res) => {
  var crearHorario = horario => {
    return new Promise((resolve, reject) => {
      horario.save().then(horarioGuardado => {
        resolve(horarioGuardado._id);
      });
    });
  };

  var crearMateriaXCurso = mxc => {
    return new Promise((resolve, reject) => {
      mxc.save().then(mxcGuardada => {
        resolve(mxcGuardada._id);
      });
    });
  };
  var mxcNuevas = [];
  let vectorIdsMXC = [];
  for (const materia of req.body.agenda) {
    //Recorrer agenda del front
    if (materia.idHorarios == null) {
      //vemos si la mxc es nueva o una modificada
      if (mxcNuevas.length != 0) {
        for (const mxcNueva of mxcNuevas) {
          //Recorrer mxcNuevas para saber si es una mxc nueva o es una ya creada que tiene un nuevo horario
          if (mxcNueva.idMateria == materia.idMateria) {
            mxcNueva.horaInicio.push({
              dia: materia.dia,
              inicio: materia.inicio,
              fin: materia.fin
            });
          } else {
            mxcNuevas.push({
              idMateria: materia.idMateria,
              idDocente: materia.idDocente,
              horarios: [
                { dia: materia.dia, inicio: materia.inicio, fin: materia.fin }
              ]
            });
          }
        }
      } else {
        mxcNuevas.push({
          idMateria: materia.idMateria,
          idDocente: materia.idDocente,
          horarios: [
            { dia: materia.dia, inicio: materia.inicio, fin: materia.fin }
          ]
        });
      }
    } else if (materia.modificado) {
      //Se actualiza el nuevo horario para una mxc dada
      Horario.findByIdAndUpdate(materia.idHorarios, {
        dia: materia.dia,
        horaInicio: materia.inicio,
        horaFin: materia.fin
      }).exec();
    }
  }

  if (mxcNuevas.length != 0) {
    //Hay mxc nuevas para guarda en la bd
    for (const mxcNueva of mxcNuevas) {
      let vectorIdsHorarios = [];
      for (const horario of mxcNueva.horarios) {
        let nuevoHorario = new Horario({
          dia: horario.dia,
          horaInicio: horario.inicio,
          horaFin: horario.fin
        });
        let idHorarioGuardado = await crearHorario(nuevoHorario);
        vectorIdsHorarios.push(idHorarioGuardado);
      }
      let nuevaMateriaXCurso = new MateriaXCurso({
        materia: mxcNueva.idMateria,
        idDocente: mxcNueva.idDocente,
        horarios: vectorIdsHorarios
      });

      let idMXC = await crearMateriaXCurso(nuevaMateriaXCurso);
      vectorIdsMXC.push(idMXC);
    }
    Curso.findByIdAndUpdate(req.body.idCurso, { materias: vectorIdsMXC }).then(
      () => {
        res.json({ exito: true, message: "nice" });
      }
    );
  } else {
    res.json({ exito: true, message: "nice" });
  }
});
//Obtiene la agenda de un curso (materias, horario y día dictadas)
//@params: idCurso
// router.get("/agenda", checkAuthMiddleware, (req, res) => {
//   Curso.aggregate([
//     {
//       $match: {
//         _id: mongoose.Types.ObjectId(req.query.idCurso)
//       }
//     },
//     {
//       $lookup: {
//         from: "materiasXCurso",
//         localField: "materias",
//         foreignField: "_id",
//         as: "MXC"
//       }
//     },
//     {
//       $unwind: {
//         path: "$MXC"
//       }
//     },
//     {
//       $lookup: {
//         from: "materia",
//         localField: "MXC.materia",
//         foreignField: "_id",
//         as: "nombreMateria"
//       }
//     },
//     {
//       $unwind: {
//         path: "$MXC.horarios"
//       }
//     },
//     {
//       $lookup: {
//         from: "horario",
//         localField: "MXC.horarios",
//         foreignField: "_id",
//         as: "horarios"
//       }
//     },
//     {
//       $project: {
//         "nombreMateria.nombre": 1,
//         horarios: 1
//       }
//     }
//   ]).then(agendaCompleta => {
//     if (agendaCompleta[0].horarios[0] == null) {
//       return res.json({
//         exito: false,
//         message: "No existen horarios registrados para este curso",
//         agenda: []
//       });
//     } else {
//       let agenda = [];
//       for (let i = 0; i < agendaCompleta.length; i++) {
//         let valor = {
//           nombre: agendaCompleta[i].nombreMateria[0].nombre,
//           dia: agendaCompleta[i].horarios[0].dia,
//           inicio: agendaCompleta[i].horarios[0].horaInicio,
//           fin: agendaCompleta[i].horarios[0].horaFin
//         };
//         agenda.push(valor);
//       }
//       res.json({
//         exito: true,
//         message: "Se ha obtenido la agenda correctamente",
//         agenda: agenda
//       });
//     }
//   });
// });

module.exports = router;
