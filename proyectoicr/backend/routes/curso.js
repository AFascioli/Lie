const express = require("express");
const router = express.Router();
const Division = require("../models/division");
const Inscripcion = require("../models/inscripcion");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const Calificacion = require("../models/calificacion");
const mongoose = require("mongoose");

router.get("/", (req, res) => {
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

router.get("/materias", (req, res) => {
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

router.post("/inscripcion", (req, res) => {
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
            message: "Estudiante inscripto exitósamente",
            exito: true
          });
        });
      });
    }
  });
});

router.get("/documentos", (req, res) => {
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

router.get("/estudiantes/materias/calificaciones", (req, res) => {
  // #resolve Filtrar por inscripción activa
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
        "curso._id": mongoose.Types.ObjectId(req.query.idcurso)
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
        as: "calificacionesX"
      }
    },
    {
      $match: {
        "calificacionesX.idMateria": mongoose.Types.ObjectId(
          req.query.idmateria
        ),
        "calificacionesX.trimestre": parseInt(req.query.trimestre, 10)
      }
    },
    {
      $lookup: {
        from: "calificacion",
        localField: "calificacionesX.calificaciones",
        foreignField: "_id",
        as: "calificacionesEstudiante"
      }
    },
    {
      $project: {
        "datosEstudiante._id": 1,
        "datosEstudiante.nombre": 1,
        "datosEstudiante.apellido": 1,
        calificacionesEstudiante: 1
      }
    }
  ]).then(documentos => {
    var respuesta = [];
    documentos.forEach(califEst => {
      var cEstudiante = {
        idEstudiante: califEst.datosEstudiante[0]._id,
        apellido: califEst.datosEstudiante[0].apellido,
        nombre: califEst.datosEstudiante[0].nombre,
        calificaciones: []
      };

      califEst.calificacionesEstudiante.forEach(calificacion => {
        var calif = {
          id: calificacion._id,
          fecha: calificacion.fecha,
          valor: calificacion.valor
        };

        cEstudiante.calificaciones.push(calif);
      });

      respuesta.push(cEstudiante);
    });
    res.status(200).json({ estudiantes: respuesta });
  });
});

router.post("/estudiantes/materias/calificaciones", (req, res) => {
  //#resolve Ver si usamos el find con "$in": {[]} para hacer una sola consulta
  console.dir(req.body);
  req.body.forEach(estudiante => {
    Inscripcion.findOne({
      activa: true, // No es necesario
      IdEstudiante: mongoose.Types.ObjectId(estudiante.IdEstudiante)
    }).then(async inscripcionE => {
      console.dir(inscripcionE);
      await CalificacionesXMateria.findById(
        inscripcionE.calificacionesXMateria._id
      ).then( async califXMateria => {
        // Se crea el nuevo vector de calificaciones para asignarle a la califXMateria
        await estudiante.calificaciones.forEach( async (calif, index) => {
          if(califXMateria.calificaciones[index]){
            califXMateria.calificaciones.map( async cc => {
              if(cc._id = calif._id)
              {
                cc.valor = calif.valor;
                await cc.save();
              }
            });
          } else {
            var calificacionN = new Calificacion({
            fecha: estudiante.calificaciones[index].fecha,
            valor: estudiante.calificaciones[index].valor
            });
            await calificacionN.save().then(async calif => {
            await califXMateria.calificaciones.push(calif);
            });
          }

          await califXMateria.save();
          //#resolve
          console.dir(califXMateria);
      });

        var cXMateriaN = new CalificacionesXMateria({
          _id: califXMateria._id,
          idmateria: califXMateria.idmateria,
          calificaciones: calificacionN,
          trimestre: califXMateria.trimestre
        });

      });
    });
  });
});
module.exports = router;
