const express = require("express");
const router = express.Router();
const Provincia = require("../models/provincia");

router.get("", (req, res, next) => {
  Provincia.find().sort({nombre: 'asc'}).then(documents => {
    res.status(200).json({
      provincias: documents
    });
  });
});

module.exports = router;
