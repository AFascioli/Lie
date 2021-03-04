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
        {
          estado: estadoSuspendido,
          $push: {
            sanciones: {
              tipo: req.body.tipoSancion,
              cantidad: 1,
              fecha: req.body.fecha,
            },
          },
        }
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
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
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
            estado: {
              $in: [
                mongoose.Types.ObjectId(idEstadoActiva),
                mongoose.Types.ObjectId(idEstadoSuspendido),
                mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
                mongoose.Types.ObjectId(idEstadoExPendiente),
                mongoose.Types.ObjectId(idEstadoPromovido),
              ],
            },
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
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    let final = req.body.length - 1;
    for (let i = 0; i <= final; i++) {
      Inscripcion.findOne({
        _id: req.body[i]._id,
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
          ],
        },
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
  let idEstadoPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Pendiente"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );

  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
          ],
        },
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
    .then(async (inscripcion) => {
      let idCicloSeleccionado = await ClaseCicloLectivo.obtenerIdCicloSegunAño(
        parseInt(req.query.añoLectivo)
      );
      let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
      let idCicloAnterior = await ClaseCicloLectivo.obtenerIdCicloAnterior();
      let cursosDisponibles = [];
      if (inscripcion.length != 0) {
        if (
          idCicloSeleccionado
            .toString()
            .localeCompare(idCicloActual.toString()) == 0
        ) {
          let añoCursoActual = parseInt(
            inscripcion[0].cursoActual[0].nombre,
            10
          );

          //Buscamos los cursos que corresponden al que se puede inscribir el estudiante
          Curso.find({
            nombre: { $regex: añoCursoActual },
            cicloLectivo: idCicloSeleccionado,
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
          //El estudiante está inscripto a un curso y por ende se fija al curso al que se puede inscribir
          let siguiente = await ClaseInscripcion.obtenerAñoHabilitado(
            inscripcion,
            idCicloSeleccionado
          );

          //Buscamos los cursos que corresponden al que se puede inscribir el estudiante
          Curso.find({
            nombre: { $regex: siguiente },
            cicloLectivo: idCicloSeleccionado,
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
        }
      } else {
        //!TODO Si selecciono el ciclo actual, buscar si tiene inscripcion pendiente para ver que curso le corresponde
        if (
          idCicloSeleccionado
            .toString()
            .localeCompare(idCicloActual.toString()) == 0
        ) {
          let inscripcionPendiente = await Inscripcion.findOne({
            idEstudiante: req.query.idEstudiante,
            estado: idEstadoPendiente,
          });

          if (inscripcionPendiente) {
            let cursoPendiente = await Curso.findById(
              inscripcionPendiente.idCurso
            );

            let añoCurso = parseInt(cursoPendiente.nombre, 10) - 1;

            Curso.find({
              nombre: { $regex: añoCurso },
              cicloLectivo: idCicloSeleccionado,
            }).then((cursos) => {
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
          } else {
            let idEstadoRegistrado = await ClaseEstado.obtenerIdEstado(
              "Estudiante",
              "Registrado"
            );
            let idEstadoDesaprobada = await ClaseEstado.obtenerIdEstado(
              "CalificacionesXMateria",
              "Desaprobada"
            );

            let estudianteSeleccionado = await Estudiante.findById(
              req.query.idEstudiante
            ).exec();

            if (
              estudianteSeleccionado.estado
                .toString()
                .localeCompare(idEstadoRegistrado.toString()) == 0
            ) {
              //El estudiante no está inscripto a ningun curso, devuelve todos los cursos almacenados
              Curso.find({ cicloLectivo: idCicloSeleccionado }).then(
                (cursos) => {
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
                }
              );
            } else {
              // Se busca la inscripcion anterior para fijarse si quedo libre
              let inscripcionAnterior = await Inscripcion.aggregate([
                {
                  $match: {
                    idEstudiante: mongoose.Types.ObjectId(
                      req.query.idEstudiante
                    ),
                    cicloLectivo: mongoose.Types.ObjectId(idCicloAnterior),
                  },
                },
                {
                  $lookup: {
                    from: "calificacionesXMateria",
                    localField: "calificacionesXMateria",
                    foreignField: "_id",
                    as: "datosMXC",
                  },
                },
              ]);

              let cursoInscripcionAnterior = await Curso.findById(
                inscripcionAnterior[0].idCurso
              );

              let añoCursoInscripcionAnterior = parseInt(
                cursoInscripcionAnterior.nombre,
                10
              );

              //Se buscan las inscripciones que tienen 3 o menos cxm desaprobadas
              let cantidadDesaprobadas = 0;
              for (const mxc of inscripcionAnterior[0].datosMXC) {
                if (
                  mxc.estado
                    .toString()
                    .localeCompare(idEstadoDesaprobada.toString()) == 0
                ) {
                  cantidadDesaprobadas++;
                }
              }

              // Si la condicion valua true, estaba promovido o promovido con examenes pendientes y se le ofrece los cursos
              // del año superior al anterior
              if (cantidadDesaprobadas <= 3) {
                let respuesta = [];
                let cursos = await Curso.find({
                  nombre: { $regex: añoCursoInscripcionAnterior + 1 },
                  cicloLectivo: idCicloActual,
                });

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
              } else {
                // El estudiante esta libre, se le ofrece el mismo año que la inscripcion anterior
                let respuesta = [];
                let cursos = Curso.find({
                  nombre: { $regex: añoCursoInscripcionAnterior },
                  cicloLectivo: idCicloActual,
                });

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
              }
            }
          }
        } else {
          //El estudiante no está inscripto a ningun curso, devuelve todos los cursos almacenados
          Curso.find({ cicloLectivo: idCicloSeleccionado }).then((cursos) => {
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
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un problema al obtener los cursos",
        error: error.message,
      });
    });
});

//Obtiene todos los cursos asignados a un docente para el ciclo lectivo actual
//@params: id de la docente
router.get("/docente", checkAuthMiddleware, async (req, res) => {
  let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
  Curso.aggregate([
    {
      $match: {
        cicloLectivo: mongoose.Types.ObjectId(idCicloActual),
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
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
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
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
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
          "calXMateria._id": 1,
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
            calXMateria: califEst.calXMateria,
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
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido con examenes pendientes"
    );
    let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Examenes pendientes"
    );
    let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido"
    );
    let idEstadoInactiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Inactiva"
    );

    Inscripcion.aggregate([
      {
        $match: {
          idCurso: mongoose.Types.ObjectId(req.query.idCurso),
          estado: {
            $in: [
              mongoose.Types.ObjectId(idEstadoActiva),
              mongoose.Types.ObjectId(idEstadoSuspendido),
              mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
              mongoose.Types.ObjectId(idEstadoExPendiente),
              mongoose.Types.ObjectId(idEstadoPromovido),
              mongoose.Types.ObjectId(idEstadoInactiva),
            ],
          },
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
          idEstadoCalifXMateria: {
            $push: "$calificacionesXMateriaDif.estado",
          },
          promedio: {
            $push: "$calificacionesXMateriaDif.promedio",
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
          promedio: {
            $first: "$promedio",
          },
          idEstadoCalifXMateria: {
            $first: "$idEstadoCalifXMateria",
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
          promedio: {
            $first: "$promedio",
          },
          idEstadoCalifXMateria: {
            $first: "$idEstadoCalifXMateria",
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
          promedio: 1,
          idEstadoCalifXMateria: 1,
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
  let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
  );

  Inscripcion.findOne({
    idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
    estado: {
      $in: [
        mongoose.Types.ObjectId(idEstadoActiva),
        mongoose.Types.ObjectId(idEstadoSuspendido),
        mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
        mongoose.Types.ObjectId(idEstadoExPendiente),
        mongoose.Types.ObjectId(idEstadoPromovido),
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
      let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Suspendido"
      );
      req.body.forEach((estudiante) => {
        Inscripcion.aggregate([
          {
            $match: {
              idEstudiante: mongoose.Types.ObjectId(estudiante.idEstudiante),
              estado: {
                $in: [
                  mongoose.Types.ObjectId(idEstadoActiva),
                  mongoose.Types.ObjectId(idEstadoSuspendido),
                ],
              },
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
            return res.status(200).json({
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

//Obtiene la agenda del año anterior de un curso seleccionado (materias, horario y día dictadas)
//@params: idCurso
router.post("/agenda/anterior", checkAuthMiddleware, async (req, res) => {
  try {
    let cursoSeleccionado = await Curso.findById(req.body.idCurso).exec();
    let idCicloAnterior = await ClaseCicloLectivo.obtenerIdCicloAnterior();

    Curso.aggregate([
      {
        $match: {
          nombre: cursoSeleccionado.nombre,
          cicloLectivo: mongoose.Types.ObjectId(idCicloAnterior),
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
        return res.status(200).json({
          exito: false,
          message: "No existen horarios registrados para este curso",
          agenda: [],
        });
      } else {
        let agenda = [];
        for (let i = 0; i < agendaCompleta.length; i++) {
          let valor = {
            nombre: agendaCompleta[i].nombreMateria[0].nombre,
            idMXC: "",
            dia: agendaCompleta[i].horarios[0].dia,
            inicio: agendaCompleta[i].horarios[0].horaInicio,
            fin: agendaCompleta[i].horarios[0].horaFin,
            idDocente: agendaCompleta[i].docente[0]._id,
            idMateria: agendaCompleta[i].nombreMateria[0]._id,
            idHorarios: null,
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
          res
            .status(200)
            .json({ exito: true, message: "Horario borrado exitosamente" });
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

    // Cuando se clona la agenda se borra la anterior para que no queden las materias "apiladas"
    if (req.body.seClono) {
      await Curso.findByIdAndUpdate(req.body.idCurso, { materias: [] }).exec();
    }

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
        await Horario.findByIdAndUpdate(materia.idHorarios, {
          dia: materia.dia,
          horaInicio: materia.inicio,
          horaFin: materia.fin,
        }).exec();
      }
    }
    if (mxcNuevas.length != 0) {
      let idCreada = await ClaseEstado.obtenerIdEstado(
        "MateriasXCurso",
        "Creada"
      );
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
          estado: idCreada,
        });

        let idMXC = await crearMateriaXCurso(nuevaMateriaXCurso);
        vectorIdsMXC.push(idMXC);
      }
      Curso.findByIdAndUpdate(req.body.idCurso, {
        $push: { materias: { $each: vectorIdsMXC } },
      }).then(() => {
        res
          .status(200)
          .json({ exito: true, message: "Materias agregadas correctamente" });
      });
    } else {
      res
        .status(200)
        .json({ exito: true, message: "Horarios modificados correctamente" });
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
      let cursoAnterior;
      let nombreCursoCicloAnterior;
      let estudiantesRespuesta = [];

      let idCicloAnterior = await ClaseCicloLectivo.obtenerIdCicloAnterior();
      let cursoElegido = await Curso.findById(req.query.idCurso);

      nombreCursoCicloAnterior = cursoElegido.nombre;
      let numeroCursoPasado = parseInt(cursoElegido.nombre, 10) - 1;
      let division = cursoElegido.nombre.substring(1, 2);
      cursoAnterior = `${numeroCursoPasado}${division}`;

      let cursoAñoAnterior = await Curso.findOne({
        nombre: cursoAnterior,
        cicloLectivo: idCicloAnterior,
      });

      let cursoEstudiantesLibres = await Curso.findOne({
        nombre: nombreCursoCicloAnterior,
        cicloLectivo: idCicloAnterior,
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
      let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Activa"
      );

      /*  1. Buscar estudiantes en estado registrado*/

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

      /* 2. Aggregate de Promovidos o Promovidos con exam. 2B '19. */
      if (parseInt(cursoElegido.nombre, 10) !== 1) {
        let idMXCDesaprobada = await ClaseEstado.obtenerIdEstado(
          "CalificacionesXMateria",
          "Desaprobada"
        );

        let obtenerEstudiantesConInscripcion = await Inscripcion.aggregate([
          {
            $match: {
              idCurso: cursoAñoAnterior._id,
            },
          },
          {
            $lookup: {
              from: "calificacionesXMateria",
              localField: "calificacionesXMateria",
              foreignField: "_id",
              as: "datosMXC",
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
              datosMXC: 1,
            },
          },
        ]);

        obtenerEstudiantesConInscripcion.forEach((inscripcion) => {
          //Se buscan las inscripciones que tienen 3 o menos cxm desaprobadas
          let cantidadDesaprobadas = 0;
          for (const mxc of inscripcion.datosMXC) {
            if (
              mxc.estado
                .toString()
                .localeCompare(idMXCDesaprobada.toString()) == 0
            ) {
              cantidadDesaprobadas++;
            }
          }
          if (cantidadDesaprobadas <= 3) {
            const estudianteRefinado = {
              idEstudiante: inscripcion.datosEstudiantes[0]._id,
              nombre: inscripcion.datosEstudiantes[0].nombre,
              apellido: inscripcion.datosEstudiantes[0].apellido,
              cursoAnterior: inscripcion.datosCurso[0].nombre,
              idInscripcion: inscripcion._id,
              seleccionado: false,
            };
            estudiantesRespuesta.push(estudianteRefinado);
          }
        });
      }
      /* 3. Aggregate de Libres 5A '19.  */

      let obtenerEstudiantesLibres = await Inscripcion.aggregate([
        {
          $match: {
            idCurso: mongoose.Types.ObjectId(cursoEstudiantesLibres._id),
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

      /* 4. Buscar todas las inscripciones activas del curso selec (2020 5A). */
      /* 5. Filtramos que los de 4 no esten incluidos en 1, 2 y 3*/

      Inscripcion.find({
        idCurso: req.query.idCurso,
        estado: idEstadoActiva,
      }).then((inscripcionesActivas) => {
        inscripcionesActivas.forEach((inscripcionActiva) => {
          estudiantesRespuesta = estudiantesRespuesta.filter(
            (estudiante) =>
              estudiante.idEstudiante
                .toString()
                .localeCompare(inscripcionActiva.idEstudiante.toString()) != 0
          );
        });
        res.status(200).json({
          estudiantes: estudiantesRespuesta,
          exito: true,
        });
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
      let cursoAnterior;
      let añoAnterior;
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

      let idEstadoInscripcionExPend = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Examenes pendientes"
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

      /* 2. Buscar los estudiantes del curso anterior que sean activo,
      promovido, promovido con ex pendientes y tamb Examenes pendientes (con todos los datos)*/
      if (añoAnterior != 0) {
        let curso = await Curso.findOne({
          nombre: cursoAnterior,
          cicloLectivo: await ClaseCicloLectivo.obtenerIdCicloActual(),
        }).exec();

        let obtenerEstudiantesEnCondicionesInsc = await Inscripcion.aggregate([
          {
            $match: {
              estado: {
                $in: [
                  mongoose.Types.ObjectId(idEstadoInscripcionActiva),
                  mongoose.Types.ObjectId(idEstadoInsPromovida),
                  mongoose.Types.ObjectId(
                    idEstadoInsPromovidaConExamPendientes
                  ),
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

        //Buscamos las inscripciones en estado Examenes pendientes que no tengan mas de 3
        //CXM con estado Pendiente examen/Desaprobada (condicion para inscribirse al prox año)
        let idEstadoCXMPendiente = await ClaseEstado.obtenerIdEstado(
          "CalificacionesXMateria",
          "Pendiente examen"
        );
        let idEstadoCXMDesaprobada = await ClaseEstado.obtenerIdEstado(
          "CalificacionesXMateria",
          "Desaprobada"
        );

        let obtenerEstudiantesExPendientes = await Inscripcion.aggregate([
          {
            $match: {
              estado: mongoose.Types.ObjectId(idEstadoInscripcionExPend),
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
            $lookup: {
              from: "calificacionesXMateria",
              localField: "calificacionesXMateria",
              foreignField: "_id",
              as: "datosCXM",
            },
          },
          {
            $project: {
              "datosEstudiante._id": 1,
              "datosEstudiante.nombre": 1,
              "datosEstudiante.apellido": 1,
              "datosCurso.nombre": 1,
              datosCXM: 1,
            },
          },
        ]);

        obtenerEstudiantesExPendientes.forEach((inscripcion) => {
          let contadorCXMPendientesDesaprobada = 0;
          for (const cxm of inscripcion.datosCXM) {
            if (
              cxm.estado
                .toString()
                .localeCompare(idEstadoCXMPendiente.toString()) == 0 ||
              cxm.estado
                .toString()
                .localeCompare(idEstadoCXMDesaprobada.toString()) == 0
            ) {
              contadorCXMPendientesDesaprobada++;
            }
          }
          if (contadorCXMPendientesDesaprobada <= 3) {
            const estudianteRefinado = {
              idEstudiante: inscripcion.datosEstudiante[0]._id,
              nombre: inscripcion.datosEstudiante[0].nombre,
              apellido: inscripcion.datosEstudiante[0].apellido,
              cursoAnterior: inscripcion.datosCurso[0].nombre,
              idInscripcion: inscripcion._id,
              seleccionado: false,
            };
            estudiantesRespuesta.push(estudianteRefinado);
          }
        });
      }
      /*3. Buscar todas las inscripciones pendientes y filtrar los estudiantes regitrados que tengan una
       */

      Inscripcion.find({
        estado: idEstadoPendienteInscripcion,
      }).then((inscripcionesPendientes) => {
        for (const inscripcionPendiente of inscripcionesPendientes) {
          estudiantesRespuesta = estudiantesRespuesta.filter(
            (estudiante) =>
              estudiante.idEstudiante
                .toString()
                .localeCompare(inscripcionPendiente.idEstudiante.toString()) !=
              0
          );
        }
        res.status(200).json({
          estudiantes: estudiantesRespuesta,
          exito: true,
        });
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
    Inscripcion.aggregate([
      [
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
            estado: mongoose.Types.ObjectId(estadoPendienteInscripcion),
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
      ],
    ])
      .then((inscripcion) => {
        if (
          inscripcion.length != 0 &&
          inscripcion[0].estado.equals(estadoPendienteInscripcion)
        ) {
          return res.status(200).json({
            inscripcionPendiente: true,
            curso: inscripcion[0].datosCurso[0].nombre,
            exito: true,
          });
        }
        res.status(200).json({
          inscripcionPendiente: false,
          curso: "",
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
          nombre: "Ficha médica",
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

// #deprecado
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

/*router.get("/estudiantes", checkAuthMiddleware, async (req, res) => {
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
      },
    },
    {
      $unwind: {
        path: "$datosEstudiante",
      },
    },
    {
      $unwind: {
        path: "$curso",
      },
    },
  ])
    .then((estudiantes) => {
      res.status(200).json({
        estudiantes: estudiantes,
        message: "Se obtuvieron los estudiantes de un curso correctamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los estudiantes de un curso",
        error: error.message,
      });
    });
});
*/

router.get("/estudiantes", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
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
        idCurso: mongoose.Types.ObjectId(req.query.curso),
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
            mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
            mongoose.Types.ObjectId(idEstadoExPendiente),
            mongoose.Types.ObjectId(idEstadoPromovido),
          ],
        },
      },
    },
    {
      $lookup: {
        from: "estudiante",
        localField: "idEstudiante",
        foreignField: "_id",
        as: "DatosEstudiantes",
      },
    },
    {
      $project: {
        "DatosEstudiantes._id": 1,
        "DatosEstudiantes.nombre": 1,
        "DatosEstudiantes.apellido": 1,
      },
    },
  ])
    .then((estudiantes) => {
      var est = [];
      estudiantes.forEach((estudiante) => {
        let datos = {
          _id: estudiante.DatosEstudiantes[0]._id,
          nombre: estudiante.DatosEstudiantes[0].nombre,
          apellido: estudiante.DatosEstudiantes[0].apellido,
        };
        est.push(datos);
      });

      return res.status(200).json({
        exito: true,
        message: "Se obtuvieron correctamente los estudiantes del curso",
        estudiante: est,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener los estudiantes del curso",
        error: error.message,
      });
    });
});

module.exports = router;
