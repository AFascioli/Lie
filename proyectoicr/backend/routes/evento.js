const express = require("express");
const Estudiante = require("../models/estudiante");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const express = require("express");
const multer = require("multer");

const Post = require("../models/post");

const router = express.Router();

const MIME_TYPE_MAPA = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg"
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAPA[file.mimetype];
    let error = new Error("El tipo de archivo es invalido");
    if (isValid) {
      error = null;
    }
    cb(error, "backend/imagenesEventos");
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAPA[file.mimetype];
    cb(null, name + "-" + Date.now() + "." + ext);
  }
});

//Registra el evento en la base de datos
//@params: evento a publicar
router.post(
  "/registrar",
  multer({ storage: storage }).single(req.body.evento.imgUrl),
  checkAuthMiddleware,
  (req, res, next) => {
    const url = req.protocol + "://" + req.get("host");
    const evento = new Evento({
      titulo: req.body.evento.titulo,
      descripcion: req.body.evento.descripcion,
      fechaEvento: req.body.eventso.fechaEvento,
      horaInicio: req.body.evento.horaInicio,
      horaFin: req.body.evento.horaFin,
      tags: req.body.evento.tags,
      imgUrl: url + "/imagenesBackend/" + req.file.filename,
      autor: req.body.evento.autor
    });
    evento.save().then(() => {
      res.status(201).json({
        message: "evento creado existosamente",
        exito:true
      });
    });
  }
);

module.exports = router;
