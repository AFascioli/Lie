const express = require("express");
const router = express.Router();
const Inscripcion = require("../models/inscripcion");

router.get("", (req, res, next) => {
  Provincia.find().sort({nombre: 'asc'}).then(documents => {
    res.status(200).json({
      provincias: documents
    });
  });
});

module.exports = router;
