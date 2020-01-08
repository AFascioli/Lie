const express = require("express");
const router = express.Router();
const Nacionalidad = require("../models/nacionalidad");

//Obtiene todas las nacionalidades que están almacenadas en la base de datos
router.get("", (req, res, next) => {
  Nacionalidad.find().then(documents => {
    res.status(200).json({
      nacionalidades: documents
    });
  });
});

module.exports = router;
