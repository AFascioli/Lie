const express = require("express");
const Estudiante = require("../models/estudiante");
const router = express.Router();
const mongoose = require("mongoose");
const AdultoResponsable = require("../models/adultoResponsable");
const Empleado = require("../models/empleado");
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

var upload = multer({ storage: storage }).single("image");

//Registra el evento en la base de datos
//@params: evento a publicar
router.post("/registrar", upload, (req, res, next) => {
  Usuario.findOne({ email: req.body.autor }).then(usuario => {
    const evento = new Evento({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fechaEvento: req.body.fechaEvento,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
      tags: req.body.tags,
      imgUrl: req.file.filename,
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

router.get("", (req, res, next) => {
  Evento.find().then(eventos => {
    res.status(200).json({
      eventos: eventos,
      message: "Evento devuelto existosamente",
      exito: true
    });
  });
});

router.post("/registrarComentario", async(req, res, next) => {
  let apellido = "";
  let nombre = "";
  let idUsuario = "";

  var obtenerDatosUsuario= (rol, emailUsuario) => {
    return new Promise((resolve, reject)=> {
      if (rol == "Adulto Responsable") {
        AdultoResponsable.findOne({ email: emailUsuario }).then(
          usuario => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({apellido: apellido, nombre:nombre, idUsuario: idUsuario});
          }
        );
      } else {
        Empleado.findOne({ email: emailUsuario }).then(
          usuario => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({apellido: apellido, nombre:nombre, idUsuario: idUsuario});
          }
        );
      }
    })
  };

  var datosUsuario = await obtenerDatosUsuario(req.body.rol, req.body.emailUsuario);

  Evento.findByIdAndUpdate(req.body.idEvento, {
    $push: { comentarios: {
      apellido: datosUsuario.apellido,
      nombre: datosUsuario.nombre,
      comentario: req.body.comentario.comentario,
      fecha: req.body.comentario.fecha,
      idUsuario: datosUsuario.idUsuario
    }
    }
  }).then(() => {
    res.status(200).json({
      message: "Se ha registrado el comentario correctamente",
      exito: true,
      nombre: nombre,
      apellido: apellido
    });
  });
});

module.exports = router;
