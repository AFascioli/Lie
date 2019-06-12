const express = require("express");
const router = express.Router();
const Nacionalidad = require("../models/nacionalidad");

router.get("", (req, res, next) => {
  Nacionalidad.findById('5d00639342e30b60bb51e128').then(documents => {
    res.status(200).json({
      nacionalidades: documents
    });
    console.log("Documentos: "+ documents)
  });
});

module.exports = router;
