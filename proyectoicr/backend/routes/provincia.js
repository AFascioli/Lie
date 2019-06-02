const express = require('express');
const router = express.Router();
const Provincia = require('../models/provincia');

router.get("", (req, res, next) => {
  const queryResponse = Provincia.find('nombre');
  const provincias;
  queryResponse.then((documentos) => {
    provincias = documentos;
  })
  res.status(200).json({provincias});
});
