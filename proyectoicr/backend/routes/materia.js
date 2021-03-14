const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
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

    const seCerro = await ClaseMateria.seCerroMateria(
      req.query.idMateria,
      req.query.idCurso,
      parseInt(req.query.trimestre, 10)
    );

    if (sePuedeCerrar && !seCerro) {
      return res.status(200).json({
        exito: true,
      });
    }
    res.status(200).json({
      exito: false,
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
    switch (parseInt(req.body.trimestre, 10)) {
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

    const idMateriaXCurso = await Curso.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.body.idCurso),
        },
      },
      {
        $lookup: {
          from: "materiasXCurso",
          localField: "materias",
          foreignField: "_id",
          as: "datosMXC",
        },
      },
      {
        $unwind: {
          path: "$datosMXC",
        },
      },
      {
        $match: {
          "datosMXC.idMateria": mongoose.Types.ObjectId(req.body.idMateria),
        },
      },
      {
        $project: {
          "datosMXC._id": 1,
        },
      },
    ]);

    await MateriasXCurso.findByIdAndUpdate(idMateriaXCurso[0].datosMXC._id, {
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

//Agrega o borra una materia si esta no tiene asociada una MateriaXCurso. 
router.post("/abm", async (req, res) => {
  try {
    let materiasNoBorradas="";
    for (const materia of req.body.materias) {
      if (materia.borrar) {
        let tieneMXC = await MateriasXCurso.findOne({idMateria: materia._id});
        if(tieneMXC!=null){
          await Materia.deleteOne({ _id: materia._id }).exec();
        }else{
          materiasNoBorradas += materia.nombre + ", "; 
        }
      } else if (materia._id == null) {
        let materiaNueva = new Materia({ nombre: materia.nombre });
        await materiaNueva.save();
      }
    }
    if(materiasNoBorradas !="") materiasNoBorradas.substring(0, materiasNoBorradas.length-2);
   
    res.status(200).json({
      materiasNoBorradas: materiasNoBorradas,
      exito: true,
      message: "Cambios registrados correctamente",
    });
  } catch (error) {
    res.status(400).json({
      exito: false,
      message: "Ocurrió un error al actualizar las materias",
      error: error.message,
    });
  }
});

// Se fija si se cerro alguna materia del curso dado para el tercer trimestre (si es asi no se habilita inscribir)
router.get("/puedoInscribir", async (req, res) => {
  let cursoMXCs = await Curso.aggregate([
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
  ]);

  for (const mxc of cursoMXCs[0].MXC) {
    const seCerro = await ClaseMateria.seCerroMateria(
      mxc.idMateria,
      req.query.idCurso,
      3
    );

    if (seCerro) {
      return res.status(200).json({
        exito: false,
        message: "No se puede inscribir un estudiante.",
      });
    }
  }

  return res.status(200).json({
    exito: true,
    message: "Se puede inscribir un estudiante.",
  });
});

module.exports = router;
