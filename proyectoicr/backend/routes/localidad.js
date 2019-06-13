const express = require("express");
const router = express.Router();
const Localidad = require("../models/localidad");

router.get("", (req, res, next) => {
  Localidad.find().sort({nombre: 'asc'}).then(documents => {
    res.status(200).json({
      localidades: documents
    });
  });
});

module.exports = router;
