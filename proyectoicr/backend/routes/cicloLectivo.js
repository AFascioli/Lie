const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");

router.get("/", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then(
    cicloLectivo => {
      if (cicloLectivo) {
        res
          .status(200)
          .json({
            cicloLectivo: cicloLectivo,
            message:
              "Se han obtenido las fechas correspondientes a este año exitosamente",
            exito: true
          });
      } else {
        res
          .status(200)
          .json({
            message:
              "No se han obtenido las fechas correspondientes a este año",
            exito: false
          });
      }
    }
  );
});

module.exports = router;
