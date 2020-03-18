const express = require("express");
const router = express.Router();
const Localidad = require("../models/localidad");

//Obtiene todas las localidades que están almacenadas en la base de datos
router.get("", (req, res, next) => {
  Localidad.find().sort({nombre: 'asc'}).then(documents => {
    res.status(200).json({
      localidades: documents
    });
  }).catch(() => {
    res.status(500).json({
      message: "Mensaje de error especifico"
    });
  });
});

module.exports = router;
