const express = require("express");
const Estudiante = require("../models/estudiante");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const multer = require("multer");
const Evento = require("../models/evento");
const Usuario = require("../models/usuario");
const path = require("path");
const Suscripcion = require("../classes/suscripcion");

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
    var cuerpo;
    var idtutores;
    // NOTIFICACIÓN
    //Construcción de cuerpo de la notificación

    // Notificar a los adultos que correspondan a los cursos de los tags/chips
    if (tags.includes("Todos los cursos")) {
      Suscripcion.notificacionMasiva(evento.titulo, this.cuerpo);
    } else {

      Suscripcion.notificacionGrupal(
        "", // Tutores de los cursos seleccionados
        evento.titulo,
        this.cuerpo
      );
    }

    // evento.save().then(() => {
    //   //Completar con código de la notificación
    //   res.status(201).json({
    //     message: "Evento creado existosamente",
    //     exito: true
    //   });
    // });
  });
});

module.exports = router;
