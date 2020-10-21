const checkAuthMiddleware = require("../middleware/check-auth");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Inscripcion = require("../models/inscripcion");
const ClaseEstado = require("../classes/estado");

router.get("/documentos", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  Inscripcion.aggregate([
    [
      {
        $match: {
          idCurso: mongoose.Types.ObjectId(req.query.idCurso),
          estado: mongoose.Types.ObjectId(idEstadoActiva),
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

router.get("/cuotas", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );

  Inscripcion.aggregate([
    {
      $match: {
        idCurso: mongoose.Types.ObjectId(req.query.idCurso),
        estado: mongoose.Types.ObjectId(idEstadoActiva),
      },
    },
    {
      $unwind: {
        path: "$cuotas",
      },
    },
    {
      $match: {
        "cuotas.pagado": false,
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
        mesCuotas: {
          $push: "$cuotas.mes",
        },
        estudiantes: {
          $first: "$estudiante",
        },
      },
    },
  ])
    .then((estudiantesXCuotas) => {
      if (!estudiantesXCuotas) {
        return res.status(200).json({
          exito: true,
          message:
            "No existe ningún estudiante que adeude cuotas en este curso",
          estudiantesXCuotas: [],
        });
      }
      res.status(200).json({
        exito: true,
        message:
          "Se obtuvieron correctamente las cuotas adeudadas por este curso",
        estudiantesXCuotas: estudiantesXCuotas,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al obtener las cuotas adeudados",
        error: error.message,
      });
    });
});

module.exports = router;
