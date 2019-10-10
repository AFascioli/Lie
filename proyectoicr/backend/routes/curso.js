const express = require("express");
const router = express.Router();
const Division = require("../models/division");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const Calificacion = require("../models/calificacion");
const mongoose = require("mongoose");
const checkAuthMiddleware=  require("../middleware/check-auth");

router.get("/", checkAuthMiddleware,(req, res) => {
  Division.find()
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

router.get("/materias", checkAuthMiddleware,(req, res) => {
  Division.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idcurso)
      }
    },
    {
      $lookup: {
        from: "horariosMaterias",
        localField: "agenda",
        foreignField: "_id",
        as: "agendaCurso"
      }
    },
    {
      $project: {
        "agendaCurso.materia": 1,
        _id: 0
      }
    },
    {
      $lookup: {
        from: "materias",
        localField: "agendaCurso.materia",
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

router.post("/inscripcion", checkAuthMiddleware,(req, res) => {
  Inscripcion.findOne({
    IdEstudiante: req.body.IdEstudiante,
    activa: true
  }).then(document => {
    if (document != null) {
      res
        .status(200)
        .json({ message: "El estudiante ya esta inscripto", exito: false });
    } else {
      Division.findOne({ curso: req.body.division }).then(document => {
        const nuevaInscripcion = new Inscripcion({
          IdEstudiante: req.body.IdEstudiante,
          IdDivision: document._id,
          documentosEntregados: req.body.documentosEntregados,
          activa: true
        });
        nuevaInscripcion.save().then(() => {
          res.status(201).json({
            message: "Estudiante inscripto exitosamente",
            exito: true
          });
        });
      });
    }
  });
});

router.get("/documentos", checkAuthMiddleware,(req, res) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "divisiones",
        localField: "IdDivision",
        foreignField: "_id",
        as: "divisiones"
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
        "divisiones.curso": req.query.curso
      }
    },
    {
      $project: {
        _id: 0,
        IdEstudiante: 1,
        documentosEntregados: 1,
        "datosEstudiante.apellido": 1,
        "datosEstudiante.nombre": 1
      }
    }
  ]).then(estudiantes => {
    res.status(200).json(estudiantes);
  });
});

router.get("/estudiantes/materias/calificaciones", checkAuthMiddleware,(req, res) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "estudiantes",
        localField: "IdEstudiante",
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
        IdDivision: 1,
        calificacionesXMateria: 1
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
      $match: {
        "curso._id": mongoose.Types.ObjectId(req.query.idcurso),
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
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "notas"
      }
    },
    {
      $unwind: {
        path: "$notas"
      }
    },
    {
      $match: {
        "notas.idMateria": mongoose.Types.ObjectId(req.query.idmateria),
        "notas.trimestre": parseInt(req.query.trimestre, 10)
      }
    },
    {
      $project: {
        "datosEstudiante._id": 1,
        "datosEstudiante.nombre": 1,
        "datosEstudiante.apellido": 1,
        "notas.calificaciones": 1
      }
    }
  ]).then(documentos => {
    var respuesta = [];
    documentos.forEach(califEst => {
      var cEstudiante = {
        idEstudiante: califEst.datosEstudiante[0]._id,
        apellido: califEst.datosEstudiante[0].apellido,
        nombre: califEst.datosEstudiante[0].nombre,
        calificaciones: califEst.notas.calificaciones
      };
      respuesta.push(cEstudiante);
    });
    res.status(200).json({ estudiantes: respuesta });
  });
});

//Registra las calificaciones por alumno de un curso y materia determinada
router.post("/estudiantes/materias/calificaciones", checkAuthMiddleware,(req, res) => {
  req.body.forEach(estudiante => {
    Inscripcion.aggregate([
      {
        $match: {
          IdEstudiante: mongoose.Types.ObjectId(estudiante.idEstudiante)
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
          ),
          "calXMatEstudiante.trimestre": parseInt(req.query.trimestre, 10)
        }
      },
      {
        $project: {
          calificaciones: 1,
          "calXMatEstudiante._id": 1
        }
      }
    ]).then(resultadoAg => {
      CalificacionesXMateria.findByIdAndUpdate(
        resultadoAg[0].calXMatEstudiante._id,
        { $set:
          {
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
});

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
