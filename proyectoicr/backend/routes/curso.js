const express = require("express");
const router = express.Router();
const Division = require("../models/division");
const Inscripcion = require("../models/inscripcion");

router.get("/",(req, res)=>{
  Division.find().select({curso: 1, _id:0}).then(cursos=>{
    res.status(200).json({cursos: cursos});
  })
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
      '$lookup': {
        'from': 'divisiones',
        'localField': 'IdDivision',
        'foreignField': '_id',
        'as': 'divisiones'
      }
    }, {
      '$lookup': {
        'from': 'estudiantes',
        'localField': 'IdEstudiante',
        'foreignField': '_id',
        'as': 'datosEstudiante'
      }
    }, {
      '$match': {
        'divisiones.curso': req.query.curso
      }
    }, {
      '$project': {
        '_id': 0,
        'IdEstudiante': 1,
        'documentosEntregados': 1,
        'datosEstudiante.apellido': 1,
        'datosEstudiante.nombre': 1
      }
    }
  ]).then(estudiantes => {
    res.status(200).json(estudiantes);
  });
});

module.exports = router;
