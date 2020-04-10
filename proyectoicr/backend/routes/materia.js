const express = require("express");
const router = express.Router();
const Materia = require("../models/materia");

router.get("", (req, res) => {
  Materia.find()
    .sort({ nombre: "asc" })
    .then((materias) => {
      res.status(200).json({
        materias: materias,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrio un error al querer obtener las materias: " + error,
      });
    });
});

module.exports = router;
