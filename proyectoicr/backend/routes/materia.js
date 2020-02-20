const express = require("express");
const router = express.Router();
const Materia = require("../models/materia");

//Obtiene todas las localidades que están almacenadas en la base de datos
router.get("", (req, res, next) => {
  Materia.find().sort({nombre: 'asc'}).then(materias => {
    res.status(200).json({
      materias: materias
    });
  });
});

module.exports = router;
