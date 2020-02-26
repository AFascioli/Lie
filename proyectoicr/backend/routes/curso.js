const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const Curso = require("../models/curso");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const Estudiante = require("../models/estudiante");
const Horario = require("../models/horario");
const MateriaXCurso = require("../models/materiasXCurso");
const ClaseInscripcion = require("../classes/inscripcion");
const ClaseCalifXMateria = require("../classes/calificacionXMateria");

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
    });
});

// Obtiene la capacidad de un curso pasado por parámetro
// @params: id del curso
router.get("/capacidad", checkAuthMiddleware, (req, res) => {
  Curso.findById(req.query.idCurso).then(curso => {
    res.status(200).json({
      message: "Operación exitosa",
      exito: true,
      capacidad: curso.capacidad
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
  ]).then(inscripcion => {
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
        });
    }
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
  ]).then(cursos => {
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
  ]).then(estudiantes => {
    res.status(200).json({
      documentos: estudiantes,
      message:
        "Se devolvieron los documentos junto con su estado de entrega correctamente",
      exito: true
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
    ]).then(documentos => {
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
    });
  }
);

//Obtiene el curso al que está inscripto un estudiante
//@params: id del estudiante
router.get("/estudiante", checkAuthMiddleware, (req, res) => {
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
        "cursosDeEstudiante.curso": 1
      }
    }
  ])
    .then(cursoDeEstudiante => {
      return res.status(200).json({
        message: "Se obtuvo el curso del estudiante exitosamente",
        exito: true,
        curso: cursoDeEstudiante[0].cursosDeEstudiante[0].curso
      });
    })
    .catch(() => {
      res.status(200).json({
        message:
          "Ocurrieron errores al querer obtener el curso del estudiante: ",
        exito: false
      });
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
  ]).then(rtdoMaterias => {
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
  ]).then(rtdoMaterias => {
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
  });
});

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
      }).then(estado => {
        resolve(estado);
      });
    });
  };

  var obtenerInscripcion = () => {
    return new Promise((resolve, reject) => {
      Inscripcion.findOne({
        idEstudiante: req.body.idEstudiante,
        activa: true
      }).then(inscripcion => {
        resolve(inscripcion);
      });
    });
  };

  var obtenerEstadoDesaprobadaMateria = () => {
    return new Promise((resolve, reject) => {
      Estado.findOne({
        nombre: "Desaprobada",
        ambito: "CalificacionesXMateria"
      }).then(estado => {
        resolve(estado);
      });
    });
  };

  var obtenerEstadoCursandoMateria = () => {
    return new Promise((resolve, reject) => {
      Estado.findOne({
        nombre: "Cursando",
        ambito: "CalificacionesXMateria"
      }).then(estado => {
        resolve(estado);
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
      ]).then(materiasDelCurso => {
        resolve(materiasDelCurso);
      });
    });
  };

  //#resolve: Se puede implementar el Promise.all, fijarse si es necesario/no rompe nada
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
    año: 2019
  });

  nuevaInscripcion.save().then(() => {
    cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
    cursoSeleccionado.save();
    //Le cambiamos el estado al estudiante
    Estado.findOne({
      nombre: "Inscripto",
      ambito: "Estudiante"
    }).then(async estadoEstudiante => {
      await Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
        estado: estadoEstudiante._id
      }).then(async () => {
        await res.status(201).json({
          message: "Estudiante inscripto exitosamente",
          exito: true
        });
      });
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
      ]).then(resultado => {
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
      });
    });
    res.json({
      message: "Calificaciones registradas correctamente",
      exito: true
    });
  }
);

//Registra las materiasXCurso de un curso dado, cada una de estas tiene su propio horario.
//@params: id del curso
//@params: agenda, que es un objeto que tiene idMateria, idDocente y el vector de horarios
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

  let vectorIdsMXC = [];
  //For que recorre MXC
  for (const materia of req.body.agenda) {
    let vectorIdsHorarios = [];
    //For que recorre Horarios
    for (const horario of materia.horarios) {
      let nuevoHorario = new Horario({
        dia: horario.dia,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin
      });
      let idHorarioGuardado = await crearHorario(nuevoHorario);
      vectorIdsHorarios.push(idHorarioGuardado);
    }
    let nuevaMateriaXCurso = new MateriaXCurso({
      materia: materia.idMateria,
      idDocente: materia.idDocente,
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
});

//Obtiene la agenda de un curso (materias, horario y día dictadas)
//@params: idCurso
router.get("/agenda", checkAuthMiddleware, (req, res) => {
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
        horarios: 1
      }
    }
  ]).then(agendaCompleta => {
    let agenda = [];
    for (let i = 0; i < agendaCompleta.length; i++) {
      let valor = {
        nombre: agendaCompleta[i].nombreMateria[0].nombre,
        dia: agendaCompleta[i].horarios[0].dia,
        inicio: agendaCompleta[i].horarios[0].horaInicio,
        fin: agendaCompleta[i].horarios[0].horaFin
      };
      agenda.push(valor);
    }
    res.json({
      exito: true,
      message: "Se ha obtenido la agenda correctamente",
      agenda: agenda
    });
  });
});

module.exports = router;
