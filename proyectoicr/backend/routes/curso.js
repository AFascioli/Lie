const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const Curso = require("../models/curso");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const Estudiante = require("../models/estudiante");
const Horario = require("../models/horario");
const Empleado = require("../models/empleado");
const MateriaXCurso = require("../models/materiasXCurso");
const AdultoResponsable = require("../models/adultoResponsable");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseInscripcion = require("../classes/inscripcion");
const ClaseEstado = require("../classes/estado");
const ClaseCalifXMateria = require("../classes/calificacionXMateria");
const Suscripcion = require("../classes/suscripcion");
const ClaseAsistencia = require("../classes/asistencia");

// Obtiene todos los cursos que están almacenados en la base de datos
router.get("/", checkAuthMiddleware, (req, res) => {
  Curso.find()
    .select({ nombre: 1, _id: 1 })
    .then((cursos) => {
      var respuesta = [];
      cursos.forEach((curso) => {
        var cursoConId = {
          id: curso._id,
          nombre: curso.nombre,
        };
        respuesta.push(cursoConId);
      });
      res.status(200).json({ cursos: respuesta });
    })
    .catch(() => {
      res.status(500).json({
        message: "Ocurrió un error al querer devolver los cursos",
      });
    });
});

notificarSancion = async function (idEstudiante, sancion) {
  titulo = "Nueva sanción.";
  await Estudiante.findById(idEstudiante).then((estudiante) => {
    cuerpo = `Se le ha registrado una nueva sanción (${sancion}) a ${estudiante.apellido} ${estudiante.nombre}.`;
  });

  AdultoResponsable.aggregate([
    {
      $match: {
        estudiantes: mongoose.Types.ObjectId(idEstudiante),
      },
    },
    {
      $lookup: {
        from: "usuario",
        localField: "idUsuario",
        foreignField: "_id",
        as: "usuario",
      },
    },
    {
      $unwind: {
        path: "$usuario",
      },
    },
    {
      $project: {
        "usuario._id": 1,
        _id: 0,
      },
    },
  ]).then((respuesta) => {
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
router.post("/registrarSancion", checkAuthMiddleware, async (req, res) => {
  if (req.body.tipoSancion == "Suspencion") {
    let estadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    Inscripcion.findOneAndUpdate(
      {
        idEstudiante: req.body.idEstudiante,
        activa: true,
      },
      { estado: estadoSuspendido }
    ).then(() => {
      return res.status(200).json({
        message: "Se ha registrado la sanción del estudiante correctamente",
        exito: true,
      });
    });
  } else {
    let modificarSancion = false;
    let indice = 0;
    Inscripcion.findOne({
      idEstudiante: req.body.idEstudiante,
      activa: true,
    }).then((inscripcion) => {
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
            activa: true,
          },
          {
            $push: {
              sanciones: {
                tipo: req.body.tipoSancion,
                cantidad: req.body.cantidad,
                fecha: req.body.fecha,
              },
            },
          }
        )
          .then(() => {
            notificarSancion(
              req.body.idEstudiante,
              req.body.tipoSancion.toLowerCase()
            );
            res.status(200).json({
              message:
                "Se ha registrado la sanción del estudiante correctamente",
              exito: true,
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico",
            });
          });
      } else {
        inscripcion.sanciones[indice].cantidad += req.body.cantidad;
        inscripcion
          .save()
          .then(() => {
            notificarSancion(
              req.body.idEstudiante,
              req.body.tipoSancion.toLowerCase()
            );
            res.status(200).json({
              message:
                "Se ha registrado la sanción del estudiante correctamente",
              exito: true,
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico",
            });
          });
      }
    });
  }
});

//Obtiene el estado de las cuotas de todos los estudiantes de un curso
//@params: id del curso
//@params: mes de la cuota
router.get("/estadoCuotas", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  // let añoActual = fechaActual.getFullYear();
  Curso.findById(req.query.idCurso)
    .then((curso) => {
      Inscripcion.aggregate([
        {
          $unwind: {
            path: "$cuotas",
          },
        },
        {
          $match: {
            activa: true,
            idCurso: mongoose.Types.ObjectId(curso._id),
            "cuotas.mes": parseInt(req.query.mes, 10),
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
          $project: {
            "estudiante.apellido": 1,
            "estudiante.nombre": 1,
            cuotas: 1,
          },
        },
      ])
        .then((estadoCuotas) => {
          if (estadoCuotas.length == 0) {
            res.status(200).json({
              cuotasXEstudiante: [],
              message: "No se han obtenido alumnos de dicho curso",
              exito: true,
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
                  mes: estadoCuotas[i].cuotas.mes,
                };
                cuotasXEstudiantes.push(cuotaXEstudiante);
              }
            }
            res.status(200).json({
              message:
                "Se ha obtenido el estado de las cuotas de un curso exitosamente",
              exito: true,
              cuotasXEstudiante: cuotasXEstudiantes,
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

//Publica el estado de las cuotas de todos los estudiantes de un curso
//@params: id de la inscripcion, mes de la cuota, estado cuota (pagada o no) y nombre y apellido
router.post("/publicarEstadoCuotas", checkAuthMiddleware, (req, res) => {
  final = req.body.length - 1;
  for (let i = 0; i <= final; i++) {
    Inscripcion.findById(req.body[i]._id)
      .then((inscripcion) => {
        inscripcion.cuotas[req.body[i].mes - 3].pagado = !inscripcion.cuotas[
          req.body[i].mes - 3
        ].pagado;
        inscripcion.save();
      })
      .catch(() => {
        res.status(500).json({
          message: "Ocurrio un error al querer registrar las cuotas",
        });
      });
  }
  res.status(200).json({
    message:
      "Se ha registrado el estado de las cuotas de un curso de manera exitosa",
    exito: true,
  });
});

// Obtiene la capacidad de un curso pasado por parámetro
// @params: id del curso
router.get("/capacidad", checkAuthMiddleware, (req, res) => {
  Curso.findById(req.query.idCurso)
    .then((curso) => {
      res.status(200).json({
        message: "Operación exitosa",
        exito: true,
        capacidad: curso.capacidad,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
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
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        activa: true,
      },
    },
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "cursoActual",
      },
    },
    {
      $lookup: {
        from: "estado",
        localField: "estado",
        foreignField: "_id",
        as: "estadoInscripcion",
      },
    },
    {
      $project: {
        estadoInscripcion: 1,
        "cursoActual.nombre": 1,
      },
    },
  ])
    .then((inscripcion) => {
      if (inscripcion.length != 0) {
        //El estudiante está inscripto a un curso y por ende se fija al curso al que se puede inscribir
        let siguiente;
        siguiente = ClaseInscripcion.obtenerAñoHabilitado(inscripcion);
        let cursosDisponibles = [];
        //Buscamos los cursos que corresponden al que se puede inscribir el estudiante
        Curso.find({ nombre: { $regex: siguiente } }).then((cursos) => {
          //Se agregan todos los cursos disponibles para inscribirse excepto el curso actual
          cursos.forEach((curso) => {
            if (!(curso.nombre == inscripcion[0].cursoActual[0].nombre)) {
              cursosDisponibles.push(curso);
            }
          });
          return res.status(200).json({
            message: "Devolvio los cursos correctamente",
            exito: true,
            cursos: cursosDisponibles,
            cursoActual: inscripcion[0].cursoActual[0],
          });
        });
      } else {
        //El estudiante no está inscripto a ningun curso, devuelve todos los cursos almacenados
        Curso.find()
          .select({ nombre: 1, _id: 1 })
          .then((cursos) => {
            var respuesta = [];
            cursos.forEach((curso) => {
              var cursoConId = {
                _id: curso._id,
                nombre: curso.nombre,
              };
              respuesta.push(cursoConId);
            });
            return res.status(200).json({
              message: "Devolvio los cursos correctamente",
              exito: true,
              cursos: respuesta,
              cursoActual: "",
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

//Obtiene todos los cursos asignados a un docente
//@params: id de la docente
router.get("/docente", checkAuthMiddleware, (req, res) => {
  Curso.aggregate([
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "materias",
        foreignField: "_id",
        as: "mxc",
      },
    },
    {
      $match: {
        "mxc.idDocente": mongoose.Types.ObjectId(req.query.idDocente),
      },
    },
  ])
    .then((cursos) => {
      var respuesta = [];
      cursos.forEach((curso) => {
        var cursoConId = {
          id: curso._id,
          nombre: curso.nombre,
        };
        respuesta.push(cursoConId);
      });

      res.status(200).json({
        cursos: respuesta,
        message: "Se devolvio los cursos que dicta la docente correctamente",
        exito: true,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
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
        as: "cursos",
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
        "cursos.nombre": req.query.curso,
      },
    },
    {
      $project: {
        _id: 0,
        idEstudiante: 1,
        documentosEntregados: 1,
        "datosEstudiante.apellido": 1,
        "datosEstudiante.nombre": 1,
      },
    },
  ])
    .then((estudiantes) => {
      res.status(200).json({
        documentos: estudiantes,
        message:
          "Se devolvieron los documentos junto con su estado de entrega correctamente",
        exito: true,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
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
          as: "datosEstudiante",
        },
      },
      {
        $project: {
          "datosEstudiante._id": 1,
          "datosEstudiante.nombre": 1,
          "datosEstudiante.apellido": 1,
          activa: 1,
          idCurso: 1,
          calificacionesXMateria: 1,
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
        $match: {
          "curso._id": mongoose.Types.ObjectId(req.query.idCurso),
          activa: true,
        },
      },
      {
        $project: {
          "datosEstudiante._id": 1,
          "datosEstudiante.nombre": 1,
          "datosEstudiante.apellido": 1,
          "curso.nombre": 1,
          calificacionesXMateria: 1,
        },
      },
      {
        $unwind: {
          path: "$calificacionesXMateria",
        },
      },
      {
        $lookup: {
          from: "calificacionesXMateria",
          localField: "calificacionesXMateria",
          foreignField: "_id",
          as: "calXMateria",
        },
      },
      {
        $match: {
          "calXMateria.idMateria": mongoose.Types.ObjectId(req.query.idMateria),
        },
      },
      {
        $unwind: {
          path: "$calXMateria",
        },
      },
      {
        $unwind: {
          path: "$calXMateria.calificacionesXTrimestre",
        },
      },
      {
        $lookup: {
          from: "calificacionesXTrimestre",
          localField: "calXMateria.calificacionesXTrimestre",
          foreignField: "_id",
          as: "notasXTrimestre",
        },
      },
      {
        $match: {
          "notasXTrimestre.trimestre": parseInt(req.query.trimestre, 10),
        },
      },
      {
        $project: {
          "datosEstudiante._id": 1,
          "datosEstudiante.nombre": 1,
          "datosEstudiante.apellido": 1,
          "notasXTrimestre.calificaciones": 1,
        },
      },
    ])
      .then((documentos) => {
        var respuesta = [];
        documentos.forEach((califEst) => {
          var calificacionesEstudiante = {
            idEstudiante: califEst.datosEstudiante[0]._id,
            apellido: califEst.datosEstudiante[0].apellido,
            nombre: califEst.datosEstudiante[0].nombre,
            calificaciones: califEst.notasXTrimestre[0].calificaciones,
          };
          respuesta.push(calificacionesEstudiante);
        });

        res.status(200).json({
          estudiantes: respuesta,
          message:
            "Se obtuvieron las calificaciones para una materia, un curso y un trimestre determinado correctamente",
          exito: true,
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "Mensaje de error especifico",
        });
      });
  }
);

//Obtiene las calificaciones de los estudiantes para un curso y una materia
//@params: id del curso
//@params: id de la materia
router.get(
  "/estudiantes/materias/calificacionesCicloLectivo",
  checkAuthMiddleware,
  (req, res) => {
    Inscripcion.aggregate([
      {
        $match: {
          idCurso: mongoose.Types.ObjectId(req.query.idCurso),
          activa: true,
        },
      },
      {
        $unwind: {
          path: "$calificacionesXMateria",
        },
      },
      {
        $lookup: {
          from: "calificacionesXMateria",
          localField: "calificacionesXMateria",
          foreignField: "_id",
          as: "calificacionesXMateriaDif",
        },
      },
      {
        $match: {
          "calificacionesXMateriaDif.idMateria": mongoose.Types.ObjectId(
            req.query.idMateria
          ),
        },
      },
      {
        $group: {
          _id: "$calificacionesXMateriaDif._id",
          idInscipcion: {
            $first: "$_id",
          },
          idEstudiante: {
            $first: "$idEstudiante",
          },
          calificacionesXTrimestre: {
            $push: {
              $arrayElemAt: [
                "$calificacionesXMateriaDif.calificacionesXTrimestre",
                0,
              ],
            },
          },
        },
      },
      {
        $unwind: {
          path: "$calificacionesXTrimestre",
        },
      },
      {
        $unwind: {
          path: "$calificacionesXTrimestre",
        },
      },
      {
        $lookup: {
          from: "calificacionesXTrimestre",
          localField: "calificacionesXTrimestre",
          foreignField: "_id",
          as: "calificacionesTrim",
        },
      },
      {
        $group: {
          _id: "$calificacionesTrim._id",
          idMateriaXCalif: {
            $first: "$_id",
          },
          idEstudiante: {
            $first: "$idEstudiante",
          },
          calificaciones: {
            $first: "$calificacionesTrim.calificaciones",
          },
          trim: {
            $first: "$calificacionesTrim.trimestre",
          },
        },
      },
      {
        $group: {
          _id: "$idMateriaXCalif",
          idEstudiante: {
            $first: "$idEstudiante",
          },
          calificaciones: {
            $push: "$calificaciones",
          },
          trimestre: {
            $push: "$trim",
          },
        },
      },
      {
        $lookup: {
          from: "estudiante",
          localField: "idEstudiante",
          foreignField: "_id",
          as: "Estudiante",
        },
      },
      {
        $project: {
          idEstudiante: 1,
          calificaciones: 1,
          trimestre: 1,
          nombre: {
            $arrayElemAt: ["$Estudiante.nombre", 0],
          },
          apellido: {
            $arrayElemAt: ["$Estudiante.apellido", 0],
          },
        },
      },
    ])
      .then((documentos) => {
        res.status(200).json({
          estudiantes: documentos,
          message:
            "Se obtuvieron las calificaciones para una materia, un curso y un trimestre determinado correctamente",
          exito: true,
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "Mensaje de error especifico",
        });
      });
  }
);

//Obtiene el curso al que está inscripto un estudiante
//@params: id del estudiante
router.get("/estudiante", checkAuthMiddleware, (req, res) => {
  Inscripcion.findOne({
    idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
    activa: true,
  }).then((inscripcion) => {
    if (inscripcion) {
      Inscripcion.aggregate([
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
            activa: true,
          },
        },
        {
          $lookup: {
            from: "curso",
            localField: "idCurso",
            foreignField: "_id",
            as: "cursosDeEstudiante",
          },
        },
        {
          $project: {
            _id: 0,
            "cursosDeEstudiante.nombre": 1,
            "cursosDeEstudiante._id": 1,
          },
        },
      ])
        .then((cursoDeEstudiante) => {
          return res.status(200).json({
            message: "Se obtuvo el curso del estudiante exitosamente",
            exito: true,
            curso: cursoDeEstudiante[0].cursosDeEstudiante[0].nombre,
            idCurso: cursoDeEstudiante[0].cursosDeEstudiante[0]._id,
          });
        })
        .catch(() => {
          res.status(500).json({
            message:
              "Ocurrieron errores al querer obtener el curso del estudiante: ",
            exito: false,
          });
        });
    } else {
      return res.status(200).json({
        message: "El estudiante no esta inscripto",
        exito: false,
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
        _id: mongoose.Types.ObjectId(req.query.idCurso),
      },
    },
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "materias",
        foreignField: "_id",
        as: "materiasDeCurso",
      },
    },
    {
      $project: {
        "materiasDeCurso.idMateria": 1,
        _id: 0,
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasDeCurso.idMateria",
        foreignField: "_id",
        as: "materias",
      },
    },
    {
      $project: {
        materias: 1,
      },
    },
  ])
    .then((rtdoMaterias) => {
      var respuesta = [];
      rtdoMaterias[0].materias.forEach((materia) => {
        var datosMateria = {
          id: materia._id,
          nombre: materia.nombre,
        };
        respuesta.push(datosMateria);
      });
      res.status(200).json({
        materias: respuesta,
        message: "Se obtieron exitosamente las materias de un curso",
        exito: true,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
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
        _id: mongoose.Types.ObjectId(req.query.idCurso),
      },
    },
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "materias",
        foreignField: "_id",
        as: "materiasDeCurso",
      },
    },
    {
      $project: {
        "materiasDeCurso.idMateria": 1,
        "materiasDeCurso.idDocente": 1,
        _id: 0,
      },
    },
    {
      $unwind: {
        path: "$materiasDeCurso",
      },
    },
    {
      $match: {
        "materiasDeCurso.idDocente": mongoose.Types.ObjectId(
          req.query.idDocente
        ),
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasDeCurso.idMateria",
        foreignField: "_id",
        as: "materias",
      },
    },
    {
      $project: {
        materias: 1,
      },
    },
  ])
    .then((rtdoMaterias) => {
      var respuesta = [];
      rtdoMaterias.forEach((materia) => {
        var datosMateria = {
          id: materia.materias[0]._id,
          nombre: materia.materias[0].nombre,
        };
        respuesta.push(datosMateria);
      });
      res.status(200).json({
        materias: respuesta,
        message:
          "Se obtuvieron todas las materias que son dictadas por un docente para un curso exitosamente",
        exito: true,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//router.get("/estadoCuotas", checkAuthMiddleware, (req, res) => {});

//Inscribe a un estudiante a un curso y los documentos entregados durante la inscripción
//@params: id estudiante que se quiere inscribir
//@params: id curso al que se lo quiere inscribir
//@params: array documentos entregados en inscripcion: true si se entregó ese documente
router.post("/inscripcion", checkAuthMiddleware, async (req, res) => {
  //Dado una id de curso, encuentra todos los datos del mismo
  if (
    ClaseInscripcion.inscribirEstudiante(
      req.body.idCurso,
      req.body.idEstudiante,
      req.body.documentosEntregados
    )
  ) {
    res.status(201).json({
      message: "Estudiante inscripto exitosamente",
      exito: true,
    });
  } else {
    res.status(400).json({
      message: "Ocurrió un error al quere inscribir al estudiante",
      exito: false,
    });
  }

  // nuevaInscripcion
  //   .save()
  //   .then(() => {
  //     cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
  //     cursoSeleccionado.save();
  //     //Le cambiamos el estado al estudiante
  //     //SE PUEDE CAMBIAR CON EL METODO OBTENERIDESTADO #resolve
  //     Estado.findOne({
  //       nombre: "Inscripto",
  //       ambito: "Estudiante",
  //     })
  //       .then(async (estadoEstudiante) => {
  //         await Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
  //           estado: estadoEstudiante._id,
  //         })
  //           .then(async () => {
  //             await res.status(201).json({
  //               message: "Estudiante inscripto exitosamente",
  //               exito: true,
  //             });
  //           })
  //           .catch(() => {
  //             res.status(500).json({
  //               message: "Mensaje de error especifico",
  //             });
  //           });
  //       })
  //       .catch(() => {
  //         res.status(500).json({
  //           message: "Mensaje de error especifico",
  //         });
  //       });
  //   })
  //   .catch(() => {
  //     res.status(500).json({
  //       message: "Mensaje de error especifico",
  //     });
  //   });
});

//Registra las calificaciones todos los estudiantes de un curso para una materia
//y un trimestre determinado en la base de datos
//@params: id de la materia
//@params: trimestre (1,2 o 3)
router.post(
  "/estudiantes/materias/calificaciones",
  checkAuthMiddleware,
  (req, res) => {
    req.body.forEach((estudiante) => {
      Inscripcion.aggregate([
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(estudiante.idEstudiante),
          },
        },
        {
          $lookup: {
            from: "calificacionesXMateria",
            localField: "calificacionesXMateria",
            foreignField: "_id",
            as: "calXMatEstudiante",
          },
        },
        {
          $unwind: {
            path: "$calXMatEstudiante",
          },
        },
        {
          $match: {
            "calXMatEstudiante.idMateria": mongoose.Types.ObjectId(
              req.query.idMateria
            ),
          },
        },
        {
          $lookup: {
            from: "calificacionesXTrimestre",
            localField: "calXMatEstudiante.calificacionesXTrimestre",
            foreignField: "_id",
            as: "calXTrimestre",
          },
        },
        {
          $unwind: {
            path: "$calXTrimestre",
          },
        },
        {
          $match: {
            "calXTrimestre.trimestre": parseInt(req.query.trimestre, 10),
          },
        },
        {
          $project: {
            "calXTrimestre.calificaciones": 1,
            "calXTrimestre._id": 1,
          },
        },
      ])
        .then((resultado) => {
          CalificacionesXTrimestre.findByIdAndUpdate(
            resultado[0].calXTrimestre._id,
            {
              $set: {
                calificaciones: estudiante.calificaciones,
              },
            }
          )
            .exec()
            .catch((e) => console.log(e));
        })
        .catch(() => {
          res.status(500).json({
            message: "Mensaje de error especifico",
          });
        });
    });
    res.json({
      message: "Calificaciones registradas correctamente",
      exito: true,
    });
  }
);

//Obtiene la agenda de un curso (materias, horario y día dictadas)
//@params: idCurso
router.get("/agenda", checkAuthMiddleware, (req, res) => {
  Curso.findById(req.query.idCurso).then((curso) => {
    if (curso.materias.length != 0) {
      Curso.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.query.idCurso),
          },
        },
        {
          $lookup: {
            from: "materiasXCurso",
            localField: "materias",
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
            "nombreMateria._id": 1,
            horarios: 1,
            "docente.nombre": 1,
            "docente.apellido": 1,
            "docente._id": 1,
            "MXC._id": 1,
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
                idMXC: agendaCompleta[i].MXC._id,
                dia: agendaCompleta[i].horarios[0].dia,
                inicio: agendaCompleta[i].horarios[0].horaInicio,
                fin: agendaCompleta[i].horarios[0].horaFin,
                idDocente: agendaCompleta[i].docente[0]._id,
                idMateria: agendaCompleta[i].nombreMateria[0]._id,
                idHorarios: agendaCompleta[i].horarios[0]._id,
                modificado: false,
              };
              agenda.push(valor);
            }
            res.json({
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
    } else {
      res.json({
        exito: true,
        message: "Se ha obtenido la agenda correctamente",
        agenda: [],
      });
    }
  });
});

//Elimina un horario para un curso y una materia
//@params: agenda, que se usa solo idHorario y la idMXC
//@params: idCurso
router.post("/eliminarHorario", checkAuthMiddleware, (req, res) => {
  Horario.findByIdAndDelete(req.body.agenda.idHorarios)
    .then(() => {
      MateriaXCurso.findByIdAndDelete(req.body.agenda.idMXC).then(() => {
        Curso.findByIdAndUpdate(req.body.idCurso, {
          $pull: { materias: { $in: req.body.agenda.idMXC } },
        }).then(() => {
          res.json({ exito: true, message: "Horario borrado exitosamente" });
        });
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Se fija cada objeto del vector agenda, si es una mxc nueva la registra
//para un curso dado, sino se modifica el horario de la mxc existente.
//@params: id del curso
//@params: agenda, que es un vector que tiene objetos con idMateria, idDocente, modificado  y el vector de horarios
//, checkAuthMiddleware
router.post("/agenda", async (req, res) => {
  var crearHorario = (horario) => {
    return new Promise((resolve, reject) => {
      horario.save().then((horarioGuardado) => {
        resolve(horarioGuardado._id);
      });
    });
  };

  var crearMateriaXCurso = (mxc) => {
    return new Promise((resolve, reject) => {
      mxc.save().then((mxcGuardada) => {
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
              fin: materia.fin,
            });
            break;
          } else {
            mxcNuevas.push({
              idMateria: materia.idMateria,
              idDocente: materia.idDocente,
              horarios: [
                { dia: materia.dia, inicio: materia.inicio, fin: materia.fin },
              ],
            });
            break;
          }
        }
      } else {
        mxcNuevas.push({
          idMateria: materia.idMateria,
          idDocente: materia.idDocente,
          horarios: [
            { dia: materia.dia, inicio: materia.inicio, fin: materia.fin },
          ],
        });
      }
    } else if (materia.modificado) {
      //Se actualiza el nuevo horario para una mxc dada
      Horario.findByIdAndUpdate(materia.idHorarios, {
        dia: materia.dia,
        horaInicio: materia.inicio,
        horaFin: materia.fin,
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
          horaFin: horario.fin,
        });
        let idHorarioGuardado = await crearHorario(nuevoHorario);
        vectorIdsHorarios.push(idHorarioGuardado);
      }
      let nuevaMateriaXCurso = new MateriaXCurso({
        idMateria: mxcNueva.idMateria,
        idDocente: mxcNueva.idDocente,
        horarios: vectorIdsHorarios,
      });

      let idMXC = await crearMateriaXCurso(nuevaMateriaXCurso);
      vectorIdsMXC.push(idMXC);
    }
    Curso.findByIdAndUpdate(req.body.idCurso, {
      $push: { materias: { $each: vectorIdsMXC } },
    }).then(() => {
      res.json({ exito: true, message: "Materias agregadas correctamente" });
    });
  } else {
    res.json({ exito: true, message: "Horarios modificados correctamente" });
  }
  // res.json({ exito: mxcNuevas, message: "Horarios modificados correctamente" });
});

router.get("/estudiantes/inscripcion", async (req, res) => {
  let numeroCursoPasado;
  let añoPasado = 2020; //#resolve
  await Curso.findById(req.query.idCurso).then((curso) => {
    numeroCursoPasado = parseInt(curso.nombre, 10) - 1;
  });
  let cursosABuscar = [`${numeroCursoPasado}A`, `${numeroCursoPasado}B`];

  let idsCursos = await Curso.find(
    { nombre: { $in: cursosABuscar } },
    { _id: 1 }
  );
  idsCursos = idsCursos.map((curso) => {
    return curso._id;
  });

  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
  );
  let idEstadoPromovidoConExam = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoLibre = await ClaseEstado.obtenerIdEstado("Inscripcion", "Libre");
  let idEstadoRegistrado = await ClaseEstado.obtenerIdEstado(
    "Estudiante",
    "Registrado"
  );

  let estadosInscripcionesABuscar = [
    mongoose.Types.ObjectId(idEstadoPromovido),
    mongoose.Types.ObjectId(idEstadoPromovidoConExam),
  ];

  //Buscamos a todas las inscripciones que tengan estado Promovido o Promovido con exam pendientes, y que sean del
  //año pasado. Filtrando tambien por los cursos que deben ser.
  let obtenerEstudiantesConInscripcion = await Inscripcion.aggregate([
    {
      $match: {
        idCurso: {
          $in: idsCursos,
        },
        año: añoPasado,
        estado: {
          $in: estadosInscripcionesABuscar,
        },
      },
    },
    {
      $lookup: {
        from: "estudiante",
        localField: "idEstudiante",
        foreignField: "_id",
        as: "datosEstudiantes",
      },
    },
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "datosCurso",
      },
    },
    {
      $project: {
        "datosEstudiantes._id": 1,
        "datosEstudiantes.nombre": 1,
        "datosEstudiantes.apellido": 1,
        "datosCurso.nombre": 1,
      },
    },
  ]);

  let obtenerEstudiantesLibres = await Inscripcion.aggregate([
    {
      $match: {
        idCurso: mongoose.Types.ObjectId(req.query.idCurso),
        año: añoPasado,
        estado: mongoose.Types.ObjectId(idEstadoLibre),
      },
    },
    {
      $lookup: {
        from: "estudiante",
        localField: "idEstudiante",
        foreignField: "_id",
        as: "datosEstudiantes",
      },
    },
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "datosCurso",
      },
    },
    {
      $project: {
        "datosEstudiantes._id": 1,
        "datosEstudiantes.nombre": 1,
        "datosEstudiantes.apellido": 1,
        "datosCurso.nombre": 1,
      },
    },
  ]);

  let obtenerEstudiantesSinInscripcion = await Estudiante.find(
    { estado: idEstadoRegistrado },
    { nombre: 1, apellido: 1 }
  );

  let estudiantesRespuesta = [];

  obtenerEstudiantesConInscripcion.forEach((inscripcion) => {
    const estudianteRefinado = {
      idEstudiante: inscripcion.datosEstudiantes[0]._id,
      nombre: inscripcion.datosEstudiantes[0].nombre,
      apellido: inscripcion.datosEstudiantes[0].apellido,
      cursoAnterior: inscripcion.datosCurso[0].nombre,
      idInscripcion: inscripcion._id,
      seleccionado: false,
    };
    estudiantesRespuesta.push(estudianteRefinado);
  });

  obtenerEstudiantesLibres.forEach((inscripcion) => {
    const estudianteRefinado = {
      idEstudiante: inscripcion.datosEstudiantes[0]._id,
      nombre: inscripcion.datosEstudiantes[0].nombre,
      apellido: inscripcion.datosEstudiantes[0].apellido,
      cursoAnterior: inscripcion.datosCurso[0].nombre,
      idInscripcion: inscripcion._id,
      seleccionado: false,
    };
    estudiantesRespuesta.push(estudianteRefinado);
  });

  obtenerEstudiantesSinInscripcion.forEach((estudiante) => {
    const estudianteRefinado = {
      idEstudiante: estudiante._id,
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      cursoAnterior: "-",
      idInscripcion: null,
      seleccionado: false, //Agregado para facilitar saber quien se debe inscribir
    };
    estudiantesRespuesta.push(estudianteRefinado);
  });

  res.status(200).json({
    estudiantes: estudiantesRespuesta,
    exito: true,
  });
});

router.post("/estudiantes/inscripcion", async (req, res) => {
  let documentosEntregados = [
    {
      nombre: "Fotocopia documento",
      entregado: false,
    },
    {
      nombre: "Ficha medica",
      entregado: false,
    },
    {
      nombre: "Informe año anterior",
      entregado: false,
    },
  ];

  for (const estudiante of req.body.estudiantes) {
    if (
      !ClaseInscripcion.inscribirEstudiante(
        req.body.idCurso,
        estudiante.idEstudiante,
        documentosEntregados
      )
    ) {
      return res.status(400).json({
        exito: false,
        message: "Ocurrió un error al querer escribir a los estudiantes",
      });
    }
  }

  res.status(400).json({
    exito: true,
    message: "Estudiantes inscriptos correctamente",
  });
});

module.exports = router;
