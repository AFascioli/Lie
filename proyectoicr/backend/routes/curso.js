const express = require("express");
const router = express.Router();
const Curso = require("../models/curso");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXMateria = require("../models/calificacionesXTrimestre");
const CalificacionesXMateriaBien = require("../models/calificacionesXMateria");
const Calificacion = require("../models/calificacion");
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");

// Obtiene todos los cursos de un año
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

//Obtiene las materias de un curso que se pasa por parametro
router.get("/materias", checkAuthMiddleware, (req, res) => {
  Curso.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idcurso)
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
      $match: {
        "materiasDeCurso.idDocente": mongoose.Types.ObjectId(
          req.query.idDocente
        ) //#resolve
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
  ]).then(materias => {
    var respuesta = [];

    materias[0].materias.forEach(materia => {
      var elemento = {
        id: materia._id,
        nombre: materia.nombre
      };

      respuesta.push(elemento);
    });

    res.status(200).json({ materias: respuesta });
  });
});

// Inscribe un estudiante seleccionado a un curso pasado por parametro
router.post("/inscripcion", checkAuthMiddleware, (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
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
        "estadoEstudiante.nombre": "registrado"
      }
    }
  ]).then(estudiante => {
    if (estudiante == null) {
      res
        .status(200)
        .json({ message: "El estudiante ya esta inscripto", exito: false });
    } else {
      //#metodo: Obtener materias de curso con id de curso
      Curso.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.query.idCurso)
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
        Estado.findOne({
          nombre: "Curso",
          ambito: "MateriaXCurso"
        }).then(estado => {
          //#resolve puede que este mal la logica
          let idsCalXMateria = [];
          materiasDelCurso.forEach(materia => {
            let idsCalificacionMatXTrim = [];

            //vas a crear las calificacionesXTrimestre de cada materia
            for (let i = 0; i < 3; i++) {
              let calificacionesXTrimestre = new CalificacionesXMateria({
                calificaciones: [0, 0, 0, 0, 0, 0],
                trimestre: i + 1
              });
              calificacionesXTrimestre.save().then(calXMateriaXTrimestre => {
                idsCalificacionMatXTrim.push(calXMateriaXTrimestre._id);
              });
            }
            //creamos las calificacionesXMateria de cada materia
            let califXMateriaNueva = new CalificacionesXMateriaBien({
              idMateria: materia,
              estado: estado._id,
              calificacionesXTrimestre: idsCalificacionMatXTrim
            });
            califXMateriaNueva.save().then(califXMateria => {
              idsCalXMateria.push(califXMateria._id);
            });
          });
          //se obtiene el id del estado y se registra la nueva inscripcion
          Curso.findOne({ curso: req.body.curso }).then(cursoSeleccionado => {
            Estado.findOne({
              nombre: "Inscripto",
              ambito: "Inscripcion"
            }).then(estado => {
              const nuevaInscripcion = new Inscripcion({
                IdEstudiante: req.body.IdEstudiante,
                IdCurso: cursoSeleccionado._id,
                documentosEntregados: req.body.documentosEntregados,
                activa: true,
                estado: estado._id,
                contadorInasistenciasInjustificada: 0,
                contadorInasistenciasJustificada: 0,
                calificacionesXMateria: idsCalXMateria
              });
              nuevaInscripcion.save().then(() => {
                res.status(201).json({
                  message: "Estudiante inscripto exitosamente",
                  exito: true
                });
              });
            });
          });
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
          CalificacionesXMateria: 1
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
          "calXMateria.materia": mongoose.Types.ObjectId(req.query.idMateria)
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
          calificaciones: califEst.notasXTrimestre.calificaciones
        };
        respuesta.push(calificacionesEstudiante);
      });

      res.status(200).json({ estudiantes: respuesta });
    });
  }
);

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
            localField: "calificacionesXTrimestre",
            foreignField: "_id",
            as: "calXTrimestre"
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
        //deberia ser calif por trimestre
        CalificacionesXMateria.findByIdAndUpdate(
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

//#resolve logica que cuando se inscribe a un nuevo alumno
// popula el array calificacionesXMateria teniendo las materias del curso.
// Teniendo eso, por cada uno de esos objetos,
// crearles 6 calificaciones con fecha y valor= "-", todo esto por trimestre.
router.get("/scripts", (req, res) => {
  var vectorMaterias = [];
  var idInscripcion = "";
  //AGREGAR ASYNC AWAIT PARA QUE SE TERMINE DE EJECUTAR EL AGGREGATE
  Inscripcion.aggregate([
    {
      $match: {
        IdDivision: mongoose.Types.ObjectId("5d27767eafa09407c479bdc3") //AAAAAAAAAAAAAAAA
      }
    },
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
        from: "horariosMaterias",
        localField: "curso.agenda",
        foreignField: "_id",
        as: "horariosMaterias"
      }
    },
    {
      $lookup: {
        from: "materias",
        localField: "horariosMaterias.materia",
        foreignField: "_id",
        as: "materias"
      }
    },
    {
      $project: {
        "materias._id": 1
      }
    }
  ]).then(resultado => {
    console.dir(+resultado);
    idInscripcion = resultado._id;
    resultado.materias.forEach(materia => {
      vectorMaterias.push(materia._id);
    });
  });

  //Por cada trimestre
  for (let trimestre = 1; trimestre < 4; trimestre++) {
    console.log("Empezo for trimestre " + trimestre);
    //Por cada materia, se crea un objeto CalificacionesXMateria
    vectorMaterias.forEach(materia => {
      console.log("for materias");
      var calificacionXMateria = new CalificacionesXMateria({
        idMateria: materia,
        calificaciones: [],
        trimestre: trimestre
      });

      //Se guarda CalificacionesXMateria y se crean las calificaciones
      calificacionXMateria.save().then(calXMatGuardada => {
        for (let index = 0; index < 5; index++) {
          console.log("for calificacion");
          var calificacion = new Calificacion({
            fecha: "-",
            valor: "-"
          });
          //Agregar Calificacion al vector calificaciones de CalificacionesXMateria
          calificacion.save().then(califGuardada => {
            CalificacionesXMateria.findByIdAndUpdate(calXMatGuardada._id, {
              $addToSet: {
                calificaciones: mongoose.Types.ObjectId(califGuardada._id)
              }
            });
          });
        }
        //Agregar CalificacionesXMateria a inscripcion
        Inscripcion.findByIdAndUpdate(idInscripcion, {
          $addToSet: {
            calificacionesXMateria: mongoose.Types.ObjectId(calXMatGuardada._id)
          }
        });
      });
    });
  }
  res.json({ message: "Parece que esta todo bien" });
});
module.exports = router;
