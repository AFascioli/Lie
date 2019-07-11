const express = require("express");
const router = express.Router();
const Division = require("../models/division");
const Inscripcion = require("../models/inscripcion");

//Retorna un vector que tiene objetos que a su vez tienen el año (5, 4, etc) con sus respectivas divisiones.
//Se tiene que hacer una mini conversion de lo que devuelve la bd (forEach dentro del then).
router.get("/", (req, res, next) => {
  Division.aggregate([
    {
      '$lookup': {
        'from': 'materiasXCurso',
        'localField': 'IdMateriasXCurso',
        'foreignField': '_id',
        'as': 'MXC'
      }
    }, {
      '$group': {
        '_id': '$MXC.curso',
        'divisiones': {
          '$addToSet': '$curso'
        }
      }
    }
  ]).then(documents =>{
    var divisionesXAño = [];
    documents.forEach(elemento => {
      divisionesXAño.push({ano: elemento._id[0], divisiones: elemento.divisiones})
    });
    res.status(200).json({
      divisionesXAño: divisionesXAño
    });
  });
});

router.post("/inscripcion", (req, res) =>{
  Division.findOne({curso: req.body.division}).then(document => {
    const nuevaInscripcion = new Inscripcion({
      IdEstudiante: req.body.IdEstudiante,
      IdDivision: document._id,
      activa: true
    });
    nuevaInscripcion.save().then(()=>{
      res.status(201).json({message: "Estudiante inscripto exitósamente"});
    });
  });
})

module.exports = router;
