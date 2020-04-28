const express = require("express");
const Inscripcion = require("../models/inscripcion");
const router = express.Router();
const mongoose = require("mongoose");
const ClaseCXM = require("../classes/calificacionXMateria");

//Dado un id de estudiante obtiene todas las materias desaprobadas del año actual
//Retorna vector con id materia y nombre materia
//@param: idEstudiante
router.get("/materiasDesaprobadas", (req, res) => {
  let fechaActual= new Date();
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        año: fechaActual.getFullYear()
      }
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "CXM",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "CXM.idMateria",
        foreignField: "_id",
        as: "nombreCXM",
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "materiasPendientes",
        foreignField: "_id",
        as: "materiasPendientesArray",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasPendientesArray.idMateria",
        foreignField: "_id",
        as: "materiasPendientesNombres",
      },
    },
    {
      $project: {
        materiasPendientesNombres: 1,
        nombreCXM: 1,
        CXM: 1,
        materiasPendientesArray: 1,
      },
    },
  ])
    .then((materias) => {
      ClaseCXM.obtenerMateriasDesaprobadas(
        materias[0].materiasPendientesNombres,
        materias[0].CXM,
        materias[0].nombreCXM
      )
        .then((materiasDesaprobadas) => {
          console.log(materiasDesaprobadas);
          if (materiasDesaprobadas.length != 0) {
            return res.status(200).json({
              message: "Materias desaprobadas obtenidas correctamente",
              exito: true,
              materiasDesaprobadas: materiasDesaprobadas,
            });
          } else {
            return res.status(200).json({
              message: "El alumno seleccionado no tiene materias desaprobadas",
              exito: true,
              materiasDesaprobadas: []
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

//Dado una id de estudiante y un trimestre obtiene todas las materias con sus respectivas calificaciones
router.get("/materia/calificaciones", (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        activa: true,
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "cXM",
      },
    },
    {
      $unwind: {
        path: "$cXM",
      },
    },
    {
      $lookup: {
        from: "calificacionesXTrimestre",
        localField: "cXM.calificacionesXTrimestre",
        foreignField: "_id",
        as: "cXT",
      },
    },
    {
      $unwind: {
        path: "$cXT",
      },
    },
    {
      $match: {
        "cXT.trimestre": parseInt(req.query.trimestre, 10),
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "cXM.idMateria",
        foreignField: "_id",
        as: "materia",
      },
    },
    {
      $project: {
        "cXT.calificaciones": 1,
        "materia.nombre": 1,
      },
    },
  ])
    .then((resultado) => {
      let vectorRespuesta = [];
      resultado.forEach((objEnResultado) => {
        vectorRespuesta.push({
          materia: objEnResultado.materia[0].nombre,
          calificaciones: objEnResultado.cXT.calificaciones,
        });
      });
      res.status(200).json({
        message: "Operación exitosa",
        exito: true,
        vectorCalXMat: vectorRespuesta,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

router.post("/registrarCalificacionExamen", (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.body.idEstudiante),
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "CXM",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "CXM.idMateria",
        foreignField: "_id",
        as: "nombreCXM",
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "materiasPendientes",
        foreignField: "_id",
        as: "materiasPendientesArray",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "materiasPendientesArray.idMateria",
        foreignField: "_id",
        as: "materiasPendientesNombres",
      },
    },
    {
      $project: {
        CXM: 1,
        materiasPendientesArray: 1,
      },
    },
  ])
    .then((materias) => {
      // recorremos las materias de este año para ver si coincide con la rendida
      // y le asignamos el promedio y estado
      for (i = 0; i < materias[0].CXM.length - 1; i++) {
        if (materias[0].CXM[i].idMateria == req.body.idMateria) {
          Estado.findOne({
            ambito: "CalificacionesXMateria",
            nombre: "Aprobada",
          })
            .then(async (estado) => {
              await CalificacionesXMateria.findOne({
                idMateria: req.body.idMateria,
                _id: materias[0].CXM[i]._id,
              })
                .then(async (CXMateria) => {
                  CXMateria.promedio = req.body.calificacion;
                  CXMateria.estado = estado._id;
                  await CXMateria.save()
                    .then(() => {
                      return res.status(200).json({
                        message:
                          "Se asignó la calificacion del examen exitosamente",
                        exito: true,
                      });
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
            })
            .catch(() => {
              res.status(500).json({
                message: "Mensaje de error especifico",
              });
            });
          return;
        }
      }

      if (materias[0].materiasPendientesArray.length != 0) {
        let indiceMateriaRendida;
        // recorremos las materias pendientes para ver si coincide con la rendida
        // y le asignamos el promedio y estado
        for (i = 0; i < materias[0].materiasPendientesArray.length - 1; i++) {
          if (
            materias[0].materiasPendientesArray[i].idMateria ==
            req.body.idMateria
          ) {
            indiceMateriaRendida = i;
            Estado.findOne({
              ambito: "CalificacionesXMateria",
              nombre: "Aprobada",
            })
              .then(async (estado) => {
                await CalificacionesXMateria.findOne({
                  idMateria: req.body.idMateria,
                  _id: materias[0].materiasPendientesArray[i]._id,
                })
                  .then(async (CXMateria) => {
                    CXMateria.promedio = req.body.calificacion;
                    CXMateria.estado = estado._id;
                    await CXMateria.save()
                      .then(() => {
                        return res.status(200).json({
                          message:
                            "Se asignó la calificacion del examen exitosamente",
                          exito: true,
                        });
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
              })
              .catch(() => {
                res.status(500).json({
                  message: "Mensaje de error especifico",
                });
              });
            //Sacamos la materia aprobada del array de materias pendientes
            materias[0].materiasPendientesArray.splice(indiceMateriaRendida, 1);
            return;
          }
        }
      }

      return res.status(200).json({
        message: "No se logró asignar la calificacion del examen",
        exito: false,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

module.exports = router;
