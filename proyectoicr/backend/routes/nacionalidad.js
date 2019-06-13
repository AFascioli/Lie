const express = require("express");
const router = express.Router();
const Nacionalidad = require("../models/nacionalidad");

router.get("", (req, res, next) => {
  Nacionalidad.find().then(documents => {
  // Nacionalidad.find().sort({name: 'asc'}).then(documents => {
    res.status(200).json({
      nacionalidades: documents
    });
    console.log("nacionalidad --> Documentos: "+ documents)
  });
});

module.exports = router;
