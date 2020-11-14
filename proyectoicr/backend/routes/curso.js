const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const Curso = require("../models/curso");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const Estudiante = require("../models/estudiante");
const Horario = require("../models/horario");
const MateriaXCurso = require("../models/materiasXCurso");
const AdultoResponsable = require("../models/adultoResponsable");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseInscripcion = require("../classes/inscripcion");
const ClaseEstado = require("../classes/estado");
const Suscripcion = require("../classes/suscripcion");
const ClaseAsistencia = require("../classes/asistencia");
const ClaseAgenda = require("../classes/agenda");
const ClaseCicloLectivo = require("../classes/cicloLectivo");

// Obtiene todos los cursos que están almacenados en la base de datos
router.get("/", checkAuthMiddleware, (req, res) => {
  CicloLectivo.findOne({ año: parseInt(req.query.anioLectivo) }).then(
    (cicloLectivo) => {
      Curso.find({ cicloLectivo: cicloLectivo._id })
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
        .catch((error) => {
          res.status(500).json({
            message: "Ocurrió un error al querer devolver los cursos",
            error: error.message,
          });
        });
    }
  );
});

//Notifica a los interesados sobre la sanción del estudiante
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
  try {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    if (req.body.tipoSancion == "Suspencion") {
      let estadoSuspendido = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Suspendido"
      );
      Inscripcion.findOneAndUpdate(
        {
          idEstudiante: req.body.idEstudiante,
          estado: idEstadoActiva,
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
        estado: idEstadoActiva,
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
              estado: idEstadoActiva,
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
          ).then(() => {
            notificarSancion(
              req.body.idEstudiante,
              req.body.tipoSancion.toLowerCase()
            );
            res.status(200).json({
              message:
                "Se ha registrado la sanción del estudiante correctamente",
              exito: true,
            });
          });
        } else {
          inscripcion.sanciones[indice].cantidad += req.body.cantidad;
          inscripcion.save().then(() => {
            notificarSancion(
              req.body.idEstudiante,
              req.body.tipoSancion.toLowerCase()
            );
            res.status(200).json({
              message:
                "Se ha registrado la sanción del estudiante correctamente",
              exito: true,
            });
          });
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      message:
        "Ocurrió un error al querer registrar una nueva sancion a un estudiante",
      error: error.message,
    });
  }
});

//Obtiene el estado de las cuotas de todos los estudiantes de un curso
//@params: id del curso
//@params: mes de la cuota
router.get("/estadoCuotas", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
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
            estado: mongoose.Types.ObjectId(idEstadoActiva),
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
      ]).then((estadoCuotas) => {
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
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener el estado de las cuotas",
        error: error.message,
      });
    });
});

//Publica el estado de las cuotas de todos los estudiantes de un curso
//@params: id de la inscripcion, mes de la cuota, estado cuota (pagada o no) y nombre y apellido
router.post("/publicarEstadoCuotas", checkAuthMiddleware, async (req, res) => {
  try {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    let final = req.body.length - 1;
    for (let i = 0; i <= final; i++) {
      Inscripcion.findOne({
        _id: req.body[i]._id,
        estado: idEstadoActiva,
      }).then((inscripcion) => {
        inscripcion.cuotas[req.body[i].mes - 3].pagado = !inscripcion.cuotas[
          req.body[i].mes - 3
        ].pagado;
        inscripcion.save();
      });
    }
    res.status(200).json({
      message: "El estado de las cuotas se ha registrado correctamente",
      exito: true,
    });
  } catch (error) {
    res.status(200).json({
      message: "Ocurrió un error al querer registrar el estado de las cuotas",
      error: error.message,
    });
  }
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener la capacidad de un curso",
        error: error.message,
      });
    });
});

//Obtiene los cursos a los que se puede inscribir un estudiante de acuerdo al estado actual (promovido o libre)
// o devuelve todos en el caso de que no este inscripto a ningun curso
// @params: id del estudiante
router.get("/cursosDeEstudiante", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: mongoose.Types.ObjectId(idEstadoActiva),
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
      let idCicloLectivo;
      CicloLectivo.findOne({ año: parseInt(req.query.añoLectivo, 10) }).then(
        async (cicloLectivo) => {
          if (inscripcion.length != 0) {
            //El estudiante está inscripto a un curso y por ende se fija al curso al que se puede inscribir
            let siguiente;
            siguiente = ClaseInscripcion.obtenerAñoHabilitado(
              inscripcion,
              parseInt(req.query.añoLectivo, 10)
            );
            let cursosDisponibles = [];
            //Buscamos los cursos que corresponden al que se puede inscribir el estudiante
            Curso.find({
              nombre: { $regex: siguiente },
              cicloLectivo: await cicloLectivo._id,
            }).then((cursos) => {
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
              .select({
                nombre: 1,
                _id: 1,
                cicloLectivo: await cicloLectivo._id,
              })
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
              });
          }
        }
      );
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un problema al obtener los cursos",
        error: error.message,
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener los cursos del docente",
        error: error.message,
      });
    });
});

//Obtiene todos los cursos asignados a un docente en un ciclo lectivo determinado
//@params: id de la docente, año del ciclo lectivo
router.get("/docentePorCiclo", checkAuthMiddleware, async (req, res) => {
  let idCicloLectivo = await ClaseEstado.getIdCicloLectivo(req.query.anio);
  Curso.aggregate([
    {
      $match: {
        cicloLectivo: mongoose.Types.ObjectId(idCicloLectivo),
      },
    },
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener los cursos del docente",
        error: error.message,
      });
    });
});

//Obtiene los documentos con su estado de entrega (true en el caso de que fue entregado) de los estudiantes de un curso dado
//@params: id del curso
router.get("/documentos", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
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
        estado: mongoose.Types.ObjectId(idEstadoActiva),
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
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al obtener los documentos junto con su estado de entrega",
        error: error.message,
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
  async (req, res) => {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
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
          idCurso: 1,
          calificacionesXMateria: 1,
          estado: 1,
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
          estado: mongoose.Types.ObjectId(idEstadoActiva),
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
      .catch((error) => {
        res.status(500).json({
          message:
            "Ocurrió un error al querer obtener las calificaciones para una materia, un curso y un trimestre determinado ",
          error: error.message,
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
  async (req, res) => {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    Inscripcion.aggregate([
      {
        $match: {
          idCurso: mongoose.Types.ObjectId(req.query.idCurso),
          estado: mongoose.Types.ObjectId(idEstadoActiva),
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
            "Se obtuvieron las calificaciones para una materia y un curso agrupado por trimestre correctamente",
          exito: true,
        });
      })
      .catch((error) => {
        res.status(500).json({
          message:
            "Ocurrió un error al querer obtener las calificaciones para el ciclo lectivo",
          error: error.message,
        });
      });
  }
);

//Obtiene el curso al que está inscripto un estudiante
//@params: id del estudiante
router.get("/estudiante", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );

  Inscripcion.findOne({
    idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
    estado: {
      $in: [
        mongoose.Types.ObjectId(idEstadoActiva),
        mongoose.Types.ObjectId(idEstadoSuspendido),
      ],
    },
  })
    .then((inscripcion) => {
      if (inscripcion) {
        Curso.findById(inscripcion.idCurso).then((cursoDeEstudiante) => {
          return res.status(200).json({
            message: "Se obtuvo el curso del estudiante exitosamente",
            exito: true,
            curso: cursoDeEstudiante.nombre,
            idCurso: cursoDeEstudiante._id,
          });
        });
      } else {
        return res.status(200).json({
          message: "El estudiante no esta inscripto",
          exito: false,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrieron errores al querer obtener el curso del estudiante",
        error: error.message,
      });
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener las materias de un curso",
        error: error.message,
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
      $group: {
        _id: "$materiasDeCurso.idMateria",
        idMateria: {
          $first: "$materiasDeCurso.idMateria",
        },
        idDocente: {
          $first: "$materiasDeCurso.idDocente",
        },
        materia: {
          $first: "$materias",
        },
      },
    },
    {
      $project: {
        materia: 1,
      },
    },
  ])
    .then((rtdoMaterias) => {
      var respuesta = [];
      rtdoMaterias.forEach((materia) => {
        var datosMateria = {
          id: materia.materia[0]._id,
          nombre: materia.materia[0].nombre,
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener las materias del docente",
        error: error.message,
      });
    });
});

//Inscribe a un estudiante a un curso y los documentos entregados durante la inscripción
//@params: id estudiante que se quiere inscribir
//@params: id curso al que se lo quiere inscribir
//@params: array documentos entregados en inscripcion: true si se entregó ese documente
router.post("/inscripcion", checkAuthMiddleware, async (req, res) => {
  //Dado una id de curso, encuentra todos los datos del mismo
  try {
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
    }
  } catch (error) {
    res.status(500).json({
      message: "Ocurrió un error al querer inscribir al estudiante",
      error: error.message,
    });
  }
});

//Inscribe a un estudiante a un curso y los documentos entregados durante la inscripción
//@params: id estudiante que se quiere inscribir
//@params: id curso al que se lo quiere inscribir
//@params: array documentos entregados en inscripcion: true si se entregó ese documente
router.post(
  "/inscripcionProximoAnio",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      //Dado una id de curso, encuentra todos los datos del mismo
      if (
        ClaseInscripcion.inscribirEstudianteProximoAnio(
          req.body.idCurso,
          req.body.idEstudiante
        )
      ) {
        res.status(201).json({
          message: "Estudiante inscripto exitosamente",
          exito: true,
        });
      }
    } catch (error) {
      res.status(500).json({
        message:
          "Ocurrió un error al querer inscribir al estudiante al proximo año",
        error: error.message,
      });
    }
  }
);

//Registra las calificaciones todos los estudiantes de un curso para una materia
//y un trimestre determinado en la base de datos
//@params: id de la materia
//@params: trimestre (1,2 o 3)
router.post(
  "/estudiantes/materias/calificaciones",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Activa"
      );
      req.body.forEach((estudiante) => {
        Inscripcion.aggregate([
          {
            $match: {
              idEstudiante: mongoose.Types.ObjectId(estudiante.idEstudiante),
              estado: mongoose.Types.ObjectId(idEstadoActiva),
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
        ]).then((resultado) => {
          CalificacionesXTrimestre.findByIdAndUpdate(
            resultado[0].calXTrimestre._id,
            {
              $set: {
                calificaciones: estudiante.calificaciones,
              },
            }
          ).exec();
        });
      });
      res.status(200).json({
        message: "Calificaciones registradas correctamente",
        exito: true,
      });
    } catch (error) {
      res.status(500).json({
        message: "Ocurrió un error al querer registrar las calificaciones",
        error: error.message,
      });
    }
  }
);

//Obtiene la agenda de un curso (materias, horario y día dictadas)
//@params: idCurso
router.get("/agenda", checkAuthMiddleware, (req, res) => {
  try {
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
        ]).then((agendaCompleta) => {
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
            res.status(200).json({
              exito: true,
              message: "Se ha obtenido la agenda correctamente",
              agenda: agenda,
            });
          }
        });
      } else {
        res.status(200).json({
          exito: true,
          message: "Se ha obtenido la agenda correctamente",
          agenda: [],
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Ocurrió un error al obtener la agenda",
      error: error.message,
    });
  }
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer eliminar el horario",
        error: error.message,
      });
    });
});

//Se fija cada objeto del vector agenda, si es una mxc nueva la registra
//para un curso dado, sino se modifica el horario de la mxc existente.
//@params: id del curso
//@params: agenda, que es un vector que tiene objetos con idMateria, idDocente, modificado  y el vector de horarios
router.post("/agenda", checkAuthMiddleware, async (req, res) => {
  try {
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
                  {
                    dia: materia.dia,
                    inicio: materia.inicio,
                    fin: materia.fin,
                  },
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
  } catch (error) {
    res.status(500).json({
      message: "Ocurrió un error al querer definir la agenda",
      error: error.message,
    });
  }
});

//Obtener los estudiantes que se pueden inscribir a un determinado curso
router.get(
  "/estudiantes/inscripcion",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      let numeroCursoPasado;
      let dateActual = new Date();
      let añoPasado = dateActual.getFullYear() - 1;
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
      let idEstadoLibre = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Libre"
      );
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
    } catch (error) {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los estudiantes a inscribir a un curso",
        error: error.message,
      });
    }
  }
);

//Obtener los estudiantes para la inscripcion pendiente a un curso (usada para la inscripcion por curso)
//@params: id estudiante que se quiere verificar
router.get(
  "/estudiantes/inscripcionProximoAnio",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      let cursoAnterior; //Este es 4A
      let añoAnterior; //Si elegimos 5A este es 4
      let estudiantesRespuesta = [];

      let idEstadoRegistrado = await ClaseEstado.obtenerIdEstado(
        "Estudiante",
        "Registrado"
      );

      let idEstadoInscripcionActiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Activa"
      );

      let idEstadoInsPromovida = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Promovido"
      );
      let idEstadoInsPromovidaConExamPendientes = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Promovido con examenes pendientes"
      );

      let idEstadoPendienteInscripcion = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Pendiente"
      );

      //1. Buscar los estudiantes en estado registrado
      let obtenerEstudiantesSinInscripcion = await Estudiante.find(
        { estado: idEstadoRegistrado },
        { nombre: 1, apellido: 1 }
      );

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

      //Nos devuelve el curso anterior (año+division), si elegimos 5A nos devuelve 4A
      await Curso.findById(req.query.idCurso).then((curso) => {
        añoAnterior = parseInt(curso.nombre, 10) - 1;
        let division = curso.nombre.substring(1, 2);
        cursoAnterior = `${añoAnterior}${division}`;
      });

      //Si es primer año solo va a tener los sin inscripcion??
      if (añoAnterior == 0) {
        return res.status(200).json({
          estudiantes: estudiantesRespuesta,
          exito: true,
        });
      }

      /* 2. Buscar los estudiantes del curso anterior que sean activo,
      promovido o promovido con ex pendientes (con todos los datos)*/

      let curso = await Curso.findOne({
        nombre: cursoAnterior,
        cicloLectivo: await ClaseCicloLectivo.obtenerIdCicloLectivo(false),
      }).exec();

      let obtenerEstudiantesEnCondicionesInsc = await Inscripcion.aggregate([
        {
          $match: {
            estado: {
              $in: [
                mongoose.Types.ObjectId(idEstadoInscripcionActiva),
                mongoose.Types.ObjectId(idEstadoInsPromovida),
                mongoose.Types.ObjectId(idEstadoInsPromovidaConExamPendientes),
              ],
            },
            idCurso: mongoose.Types.ObjectId(curso._id),
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
          $lookup: {
            from: "curso",
            localField: "idCurso",
            foreignField: "_id",
            as: "datosCurso",
          },
        },
        {
          $project: {
            "datosEstudiante._id": 1,
            "datosEstudiante.nombre": 1,
            "datosEstudiante.apellido": 1,
            "datosCurso.nombre": 1,
          },
        },
      ]);

      obtenerEstudiantesEnCondicionesInsc.forEach((inscripcion) => {
        const estudianteRefinado = {
          idEstudiante: inscripcion.datosEstudiante[0]._id,
          nombre: inscripcion.datosEstudiante[0].nombre,
          apellido: inscripcion.datosEstudiante[0].apellido,
          cursoAnterior: inscripcion.datosCurso[0].nombre,
          idInscripcion: inscripcion._id,
          seleccionado: false,
        };
        estudiantesRespuesta.push(estudianteRefinado);
      });

      /*3. Buscar todas las inscripciones pendientes del curso selec (6A 2021)
       (solo obtenemos id estudiante)
       */
      /*4. Filtras estudiantes paso 1 con los estudiantes obtenidos paso 2
       (si coinciden los sacamos y no se envia al front).  */

      Inscripcion.find({
        estado: idEstadoPendienteInscripcion,
        curso: req.query.idCurso,
      }).then((inscripcionesPendientes) => {
        for (let index = 0; index < inscripcionesPendientes.length; index++) {
          estudiantesRespuesta = estudiantesRespuesta.filter(
            (estudiante) =>
              estudiante.idEstudiante !==
              inscripcionesPendientes[index].idEstudiante
          );
        }
      });

      res.status(200).json({
        estudiantes: estudiantesRespuesta,
        exito: true,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los estudiantes para la inscripcion pendiente a un curso",
        error: error.message,
      });
    }
  }
);

//Validar si el estudiante tiene o no inscripcion pendiente
//@params: id estudiante que se quiere verificar
router.get(
  "/estudiante/inscripcionPendiente",
  checkAuthMiddleware,
  async (req, res) => {
    var estadoPendienteInscripcion = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Pendiente"
    );

    Inscripcion.find({ idEstudiante: req.query.idEstudiante })
      .then((inscripciones) => {
        inscripciones.forEach((inscripcion) => {
          if (inscripcion.estado.equals(estadoPendienteInscripcion)) {
            return res.status(200).json({
              inscripcionPendiente: true,
              exito: true,
            });
          }
        });
        res.status(200).json({
          inscripcionPendiente: false,
          exito: true,
        });
      })
      .catch((error) => {
        res.status(500).json({
          message:
            "Ocurrió un error al querer validar si el estudiante tiene o no inscripción pendiente",
          error: error.messages,
        });
      });
  }
);

//Inscribe un conjunto de estudiantes a un curso para el año en curso
//@params: lista de estudiantes
//@params: id curso al que se lo quiere inscribir
router.post(
  "/estudiantes/inscripcion",
  checkAuthMiddleware,
  async (req, res) => {
    try {
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
          estudiante.seleccionado &&
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

      res.status(200).json({
        exito: true,
        message: "Estudiantes inscriptos correctamente",
      });
    } catch (error) {
      res.status(200).json({
        error: error.message,
        message: "Ocurrió un error al querer escribir a los estudiantes",
      });
    }
  }
);

//Inscribe un conjunto de estudiantes a un curso para el proximo año
//@params: lista de estudiantes
//@params: id curso al que se lo quiere inscribir
router.post(
  "/estudiantes/inscripcionProximoAnio",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      for (const estudiante of req.body.estudiantes) {
        if (
          estudiante.seleccionado &&
          !ClaseInscripcion.inscribirEstudianteProximoAnio(
            req.body.idCurso,
            estudiante.idEstudiante
          )
        ) {
          return res.status(400).json({
            exito: false,
            message: "Ocurrió un error al querer escribir a los estudiantes",
          });
        }
      }

      res.status(200).json({
        exito: true,
        message: "Estudiantes inscriptos correctamente",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        message: "Ocurrió un error al querer escribir a los estudiantes",
      });
    }
  }
);

router.post(
  "/agenda/horariosAnioAnterior",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      let rtdo = await ClaseAgenda.clonarAgenda(
        req.body.idCurso,
        req.body.yearSelected
      );
      if (rtdo) {
        return res.status(200).json({
          exito: true,
          message: "Se clonó la agenda correctamente",
        });
      }
      res.status(200).json({
        exito: false,
        message: "No existe una agenda definida para el año anterior",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        message: "Ocurrió un error al querer clonar la agenda",
      });
    }
  }
);

module.exports = router;
