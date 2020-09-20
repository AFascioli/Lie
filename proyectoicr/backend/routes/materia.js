const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const Materia = require("../models/materia");
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
router.get("/cierre", checkAuthMiddleware, async (req, res) => {
  try {
    const sePuedeCerrar = await ClaseMateria.sePuedeCerrarMateria(
      req.query.idMateria,
      req.query.idCurso,
      req.query.trimestre
    );
    res.status(200).json({
      exito: sePuedeCerrar,
    });
  } catch (error) {
    res.status(400).json({
      exito: false,
    });
  }
});

//Cambia el estado de la MateriaXCurso segun el trimestre que se cerro. Si se cerro el tercer trimestre,
//Se cambia el estado de todas las CXM y se les calcula el promedio general
//@params: trimestre, idCurso, idMateria e idMateriaXCurso
router.post("/cierre", checkAuthMiddleware, async (req, res) => {
  try {
    let nombreEstadoMXC = "";
    switch (req.body.trimestre) {
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
      nombreEstado
    );

    MateriasXCurso.findByIdAndUpdate(req.body.idMateriaXCurso, {
      estado: idEstadoNuevo,
    });

    res.status(200).json({
      exito: true,
      message: "Materia cerrada correctamente"
    });
  } catch (error) {
    res.status(400).json({
      exito: false,
      message: "Ocurrio un error al cerrar la materia: "+error.message
    });
  }
});
module.exports = router;
