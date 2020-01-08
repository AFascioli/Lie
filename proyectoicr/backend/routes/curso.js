const express = require("express");
const router = express.Router();
const Curso = require("../models/curso");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const mongoose = require("mongoose");
const Estudiante = require("../models/estudiante");
const checkAuthMiddleware = require("../middleware/check-auth");

// Obtiene todos los cursos sin filtrar
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

//Obtiene todos los cursos asignados a un docente
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

    res.status(200).json({ cursos: respuesta });
  });
});

//Obtiene las materias de un curso y un docente que se pasa por parametro
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
    res.status(200).json({ materias: respuesta });
  });
});

//Obtiene las materias de un curso y un docente que se pasa por parametro
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
    res.status(200).json({ materias: respuesta });
  });
});

router.get("/capacidad", checkAuthMiddleware, (req, res) => {
  Curso.findById(req.query.idCurso).then(curso => {
    res.status(200).json({
      message: "Operación exitosa",
      exito: true,
      capacidad: curso.capacidad
    });
  });
});

// #deprecated Inscribe un estudiante seleccionado a un curso pasado por parametro
// router.post("/inscripcion", checkAuthMiddleware, (req, res) => {
//   Estudiante.aggregate([
//     {
//       $match: {
//         _id: mongoose.Types.ObjectId(req.body.idEstudiante),
//         activo: true
//       }
//     },
//     {
//       $lookup: {
//         from: "estado",
//         localField: "estado",
//         foreignField: "_id",
//         as: "estadoEstudiante"
//       }
//     },
//     {
//       $match: {
//         "estadoEstudiante.nombre": "Registrado"
//       }
//     }
//   ]).then(estudiante => {
//     if (estudiante.length == 0) {
//       res.status(200).json({
//         message: "El estudiante ya esta inscripto en un curso",
//         exito: false
//       });
//     } else {
//       //#metodo: Obtener materias de curso con id de curso
//       Curso.aggregate([
//         {
//           $match: {
//             _id: mongoose.Types.ObjectId(req.query.idCurso)
//           }
//         },
//         {
//           $unwind: "$materias"
//         },
//         {
//           $lookup: {
//             from: "materiasXCurso",
//             localField: "materias",
//             foreignField: "_id",
//             as: "materiasDelCurso"
//           }
//         },
//         {
//           $project: {
//             "materiasDelCurso.materia": 1,
//             _id: 0
//           }
//         }
//       ]).then(materiasDelCurso => {
//         Estado.findOne({
//           nombre: "Cursando",
//           ambito: "CalificacionesXMateria"
//         }).then(estado => {
//           //#resolve puede que este mal la logica
//           let idsCalXMateria = [];
//           materiasDelCurso.forEach(materia => {
//             let idsCalificacionMatXTrim = [];

//             //vas a crear las calificacionesXTrimestre de cada materia
//             for (let i = 0; i < 3; i++) {
//               let calificacionesXTrimestre = new CalificacionesXTrimestre({
//                 calificaciones: [0, 0, 0, 0, 0, 0],
//                 trimestre: i + 1
//               });
//               calificacionesXTrimestre.save().then(calXMateriaXTrimestre => {
//                 idsCalificacionMatXTrim.push(calXMateriaXTrimestre._id);
//               });
//             }
//             //creamos las calificacionesXMateria de cada materia
//             let califXMateriaNueva = new CalificacionesXMateria({
//               idMateria: materia,
//               estado: estado._id,
//               calificacionesXTrimestre: idsCalificacionMatXTrim
//             });
//             califXMateriaNueva.save().then(califXMateria => {
//               idsCalXMateria.push(califXMateria._id);
//             });
//           });
//           //se obtiene el id del estado y se registra la nueva inscripcion
//           Curso.findOne({ _id: req.body.idCurso }).then(cursoSeleccionado => {
//             Estado.findOne({
//               nombre: "Inscripto",
//               ambito: "Inscripcion"
//             }).then(estado => {
//               const nuevaInscripcion = new Inscripcion({
//                 idEstudiante: req.body.idEstudiante,
//                 idCurso: cursoSeleccionado._id,
//                 documentosEntregados: req.body.documentosEntregados,
//                 activa: true,
//                 estado: estado._id,
//                 contadorInasistenciasInjustificada: 0,
//                 contadorInasistenciasJustificada: 0,
//                 calificacionesXMateria: idsCalXMateria
//               });
//               nuevaInscripcion.save().then(() => {
//                 cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
//                 cursoSeleccionado.save();
//                 //Le cambiamos el estado al estudiante
//                 Estado.findOne({
//                   nombre: "Inscripto",
//                   ambito: "Estudiante"
//                 }).then(estadoEstudiante => {
//                   Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
//                     estado: estadoEstudiante._id
//                   }).then(() => {
//                     res.status(201).json({
//                       message: "Estudiante inscripto exitosamente",
//                       exito: true
//                     });
//                   });
//                 });
//               });
//             });
//           });
//         });
//       });
//     }
//   });
// });

// Inscribe un estudiante seleccionado a un curso pasado por parametro
router.post("/inscripcion", checkAuthMiddleware, (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.body.idEstudiante),
        activo: true
      }
    },
    {
      $lookup: {
        from: "estado",
        localField: "estado",
        foreignField: "_id",
        as: "estadoEstudiante"
      }
    },
    {
      $match: {
        "estadoEstudiante.nombre": "Registrado"
      }
    }
  ]).then(estudiante => {
    if (estudiante.length == 0) {
      res.status(200).json({
        message: "El estudiante ya esta inscripto en un curso",
        exito: false
      });
    } else {
      //#metodo: Obtener materias de curso con id de curso
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
        let idsCalXMateria = [];
        Estado.findOne({
          nombre: "Cursando",
          ambito: "CalificacionesXMateria"
        })
          .then(estado => {
            //#resolve puede que este mal la logica
            materiasDelCurso.forEach(elemento => {
              let idsCalificacionMatXTrim = [];
              //vas a crear las calificacionesXTrimestre de cada materia
              for (let i = 0; i < 3; i++) {
                let calificacionesXTrim = new CalificacionesXTrimestre({
                  calificaciones: [0, 0, 0, 0, 0, 0],
                  trimestre: i + 1
                });
                calificacionesXTrim.save().then(calXMateriaXTrimestre => {
                  idsCalificacionMatXTrim.push(calXMateriaXTrimestre._id);
                });
              }
              //creamos las calificacionesXMateria de cada materia
              let califXMateriaNueva = new CalificacionesXMateria({
                idMateria: elemento.materiasDelCurso[0].materia,
                estado: estado._id,
                calificacionesXTrimestre: []
              });

              setTimeout(() => {
                idsCalXMateria.push(califXMateriaNueva._id);
                califXMateriaNueva.calificacionesXTrimestre = idsCalificacionMatXTrim;
                califXMateriaNueva.save();
              }, 2000);
            });
          })
          .then(() => {
            //se obtiene el id del estado y se registra la nueva inscripcion
            setTimeout(() => {
              Curso.findOne({ _id: req.body.idCurso }).then(cursoSeleccionado => {
                Estado.findOne({
                  nombre: "Inscripto",
                  ambito: "Inscripcion"
                }).then(estado => {
                  const nuevaInscripcion = new Inscripcion({
                    idEstudiante: req.body.idEstudiante,
                    idCurso: cursoSeleccionado._id,
                    documentosEntregados: req.body.documentosEntregados,
                    activa: true,
                    estado: estado._id,
                    contadorInasistenciasInjustificada: 0,
                    contadorInasistenciasJustificada: 0,
                    calificacionesXMateria: idsCalXMateria
                  });
                  nuevaInscripcion.save().then(() => {
                    cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
                    cursoSeleccionado.save();
                    //Le cambiamos el estado al estudiante
                    Estado.findOne({
                      nombre: "Inscripto",
                      ambito: "Estudiante"
                    }).then(estadoEstudiante => {
                      Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
                        estado: estadoEstudiante._id
                      }).then(() => {
                        res.status(201).json({
                          message: "Estudiante inscripto exitosamente",
                          exito: true
                        });
                      });
                    });
                  });
                });
              });
            }, 5000);

          });
      });
    }
  });
 });

//Obtiene los documentos entregados de los estudiantes de un curso dado
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
    res.status(200).json(estudiantes);
  });
});

//obtiene las calificaciones de los estudiantes dado un curso y una materia
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

      res.status(200).json({ estudiantes: respuesta });
    });
  }
);

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
    .catch(err => {
      res.status(200).json({
        message: "Ocurrieron errores al querer obtener el curso del estudiante",
        exito: false
      });
    });
});

//Registra las calificaciones por alumno de un curso y materia determinada
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

module.exports = router;
