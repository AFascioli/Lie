const express = require("express");
const router = express.Router();
const Nacionalidad = require("../models/nacionalidad");
const checkAuthMiddleware = require("../middleware/check-auth");
const Localidad = require("../models/localidad");
const Provincia = require("../models/provincia");

//Obtiene todas las provincias que están almacenadas en la base de datos
router.get("/provincia", checkAuthMiddleware, (req, res, next) => {
  Provincia.find()
    .sort({ nombre: "asc" })
    .then((documents) => {
      res.status(200).json({
        provincias: documents,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "No se ha podido obtener las provincias correctamente",
        error: error.message,
      });
    });
});

//Obtiene todas las localidades que están almacenadas en la base de datos
router.get("/localidad", checkAuthMiddleware, (req, res, next) => {
  Localidad.find()
    .sort({ nombre: "asc" })
    .then((documents) => {
      res.status(200).json({
        localidades: documents,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "No se ha podido obtener las localidades correctamente",
        error: message,
      });
    });
});

//Obtiene todas las nacionalidades que están almacenadas en la base de datos
router.get("/nacionalidad", checkAuthMiddleware, (req, res, next) => {
  Nacionalidad.find()
    .then((documents) => {
      res.status(200).json({
        nacionalidades: documents,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "No se ha podido obtener las nacionalidades correctamente",
        error: error.message,
      });
    });
});

module.exports = router;
