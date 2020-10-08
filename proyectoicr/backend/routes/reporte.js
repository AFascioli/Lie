const checkAuthMiddleware = require("../middleware/check-auth");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Inscripcion = require("../models/inscripcion");
const ClaseEstado = require("../classes/estado");

router.get("/documentos", checkAuthMiddleware, async (req, res) => {
  console.log(req.query.idCurso);
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );

  Inscripcion.aggregate([
    [
      {
        $match: {
          idCurso: mongoose.types.ObjectId(req.query.idCurso),
          estado: mongoose.types.ObjectId(idEstadoActiva),
        },
      },
      {
        $unwind: {
          path: "$documentosEntregados",
        },
      },
      {
        $match: {
          "documentosEntregados.entregado": false,
        },
      },
      {
        $lookup: {
          from: "estudiante",
          localField: "idEstudiante",
          foreignField: "_id",
          as: "estudiante",
        },
      },
      {
        $unwind: {
          path: "$estudiante",
        },
      },
      {
        $addFields: {
          estudiante: {
            $concat: ["$estudiante.apellido", ", ", "$estudiante.nombre"],
          },
          documento: "$documentosEntregados.nombre",
        },
      },
      {
        $group: {
          _id: "$idEstudiante",
          estudiantes: {
            $first: "$estudiante",
          },
          docuemntos: {
            $push: "$documento",
          },
        },
      },
    ],
  ])
    .then((estudiantesXDocs) => {
      if (!estudiantesXDocs) {
        return res.status(200).json({
          exito: true,
          message:
            "No existe ningún estudiante que adeude documentos para este curso",
          estudiantesXDocs: [],
        });
      }
      res.status(200).json({
        exito: true,
        message:
          "Se obtuvieron correctamente los documentos adeudados por este curso",
        estudiantesXDocs: estudiantesXDocs,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener los documentos adeudados",
        error: error.message,
      });
    });
});

module.exports = router;
