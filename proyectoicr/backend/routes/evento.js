const express = require("express");
const Estudiante = require("../models/estudiante");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const multer = require("multer");
const Evento = require("../models/evento");
const Usuario = require("../models/usuario");
const path = require("path");

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
    cb(error, "backend/images");
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

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log("FILE>>>" , file);
//     cb(null, './backend/images')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
//   }
// })

var upload = multer({ storage: storage }).single("image");

//Registra el evento en la base de datos
//@params: evento a publicar
router.post("/registrar", upload, (req, res, next) => {
  Usuario.findOne({ email: req.body.autor }).then(usuario => {
    const url = req.protocol + "://" + req.get("host");
    const evento = new Evento({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fechaEvento: req.body.fechaEvento,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
      tags: req.body.tags,
      imgUrl: url + "/images/" + req.body.imgUrl,
      autor: usuario._id
    });
    evento.save().then(() => {
      res.status(201).json({
        message: "Evento creado existosamente",
        exito: true
      });
    });
  });
});
//Modifica el evento en la base de datos
//@params: evento a publicar
router.patch("/editar", checkAuthMiddleware, (req, res, next) => {
  Evento.findByIdAndUpdate(req.body._id, {
    titulo: req.body.titulo,
    descripcion: req.body.descripcion,
    fechaEvento: req.body.fechaEvento,
    horaInicio: req.body.horaInicio,
    horaFin: req.body.horaFin,
    tags: req.body.tags,
    imgUrl: url + "/images/" + req.body.imgUrl,
    autor: usuario._id
  })
    .then(() => {
      res.status(200).json({
        message: "Evento modificado exitosamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(200).json({
        message: "Ocurrió un problema al intentar modificar el evento",
        exito: false
      });
    });
});

router.get("/verEvento", checkAuthMiddleware, (req, res) => {
  Evento.aggregate([
    {
      $match: {
        titulo: req.query.titulo
      }
    }
  ]).then(eventoEncontrado => {
    return res.status(200).json({
      message: "Devolvio el evento correctamente",
      exito: true,
      evento: eventoEncontrado
    });
  });
});

module.exports = router;
