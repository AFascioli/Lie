const express = require("express");
const router = express.Router();
const Nacionalidad = require("../models/nacionalidad");
const Localidad = require("../models/localidad");
const Provincia = require("../models/provincia");

//Obtiene todas las provincias que están almacenadas en la base de datos
router.get("/provincia", (req, res, next) => {
  Provincia.find()
    .sort({ nombre: "asc" })
    .then((documents) => {
      res.status(200).json({
        provincias: documents,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "No se ha podido obtener las provincias correctamente",
      });
    });
});

//Obtiene todas las localidades que están almacenadas en la base de datos
router.get("/localidad", (req, res, next) => {
  Localidad.find()
    .sort({ nombre: "asc" })
    .then((documents) => {
      res.status(200).json({
        localidades: documents,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "No se ha podido obtener las localidades correctamente",
      });
    });
});

//Obtiene todas las nacionalidades que están almacenadas en la base de datos
router.get("/nacionalidad", (req, res, next) => {
  Nacionalidad.find()
    .then((documents) => {
      res.status(200).json({
        nacionalidades: documents,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "No se ha podido obtener las nacionalidades correctamente",
      });
    });
});

module.exports = router;
