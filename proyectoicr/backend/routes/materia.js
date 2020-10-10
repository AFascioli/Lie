const express = require("express");
const router = express.Router();
const mongoose= require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const Materia = require("../models/materia");
const Curso = require("../models/curso");
const MateriasXCurso = require("../models/materiasXCurso");
const ClaseMateria = require("../classes/materia");
const ClaseEstado = require("../classes/estado");
const ClaseCalificacionXMateria = require("../classes/calificacionXMateria");

router.get("", checkAuthMiddleware, (req, res) => {
  Materia.find()
    .sort({ nombre: "asc" })
    .then((materias) => {
      res.status(200).json({
        materias: materias,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrio un error al querer obtener las materias: ",
        error: error.message,
      });
    });
});

//Responde con un booleano si se puede cerrar o no un trimestre en particular
router.get("/cierre", async (req, res) => {
  try {
    const sePuedeCerrar = await ClaseMateria.sePuedeCerrarMateria(
      req.query.idMateria,
      req.query.idCurso,
      parseInt(req.query.trimestre, 10)
    );
    res.status(200).json({
      exito: sePuedeCerrar,
    });
  } catch (error) {
    res.status(400).json({
      exito: false,
      message:
        "Ocurrió un error al querer determinar si se puede cerrar un trimestre",
      error: error.message,
    });
  }
});

//Cambia el estado de la MateriaXCurso segun el trimestre que se cerro. Si se cerro el tercer trimestre,
//Se cambia el estado de todas las CXM y se les calcula el promedio general
//@params: trimestre, idCurso, idMateria e idMateriaXCurso
router.post("/cierre", checkAuthMiddleware, async (req, res) => {
  try {
    let nombreEstadoMXC = "";
    switch (parseInt(req.query.trimestre, 10)) {
      case 1:
        nombreEstadoMXC = "En segundo trimestre";
        break;
      case 2:
        nombreEstadoMXC = "En tercer trimestre";
        break;
      case 3:
        await ClaseCalificacionXMateria.cerrarMateriaTercerTrimestre(
          req.body.idCurso,
          req.body.idMateria
        );
        nombreEstadoMXC = "Cerrada";
        break;
      default:
        break;
    }
    const idEstadoNuevo = await ClaseEstado.obtenerIdEstado(
      "MateriasXCurso",
      nombreEstadoMXC
    );
    
    const idMateriaXCurso= await Curso.aggregate([
      {
        '$match': {
          '_id': mongoose.Types.ObjectId(req.body.idCurso)
        }
      }, {
        '$lookup': {
          'from': 'materiasXCurso', 
          'localField': 'materias', 
          'foreignField': '_id', 
          'as': 'datosMXC'
        }
      }, {
        '$unwind': {
          'path': '$datosMXC'
        }
      }, {
        '$match': {
          'datosMXC.idMateria': mongoose.Types.ObjectId(req.body.idMateria)
        }
      }, {
        '$project': {
          'datosMXC._id': 1
        }
      }
    ]);

    await MateriasXCurso.findByIdAndUpdate(idMateriaXCurso.datosMXC._id, {
      estado: idEstadoNuevo,
    }).exec();

    res.status(200).json({
      exito: true,
      message: "Materia cerrada correctamente",
    });
  } catch (error) {
    res.status(400).json({
      exito: false,
      message: "Ocurrio un error al cerrar la materia ",
      error: error.message,
    });
  }
});

module.exports = router;
