const express = require("express");
const Evento = require("../models/evento");
const router = express.Router();
const mongoose = require("mongoose");
const AdultoResponsable = require("../models/adultoResponsable");
const Empleado = require("../models/empleado");
const checkAuthMiddleware = require("../middleware/check-auth");
const multer = require("multer");
const Usuario = require("../models/usuario");
const path = require("path");
const Admin = require("../models/administrador");
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
    var cuerpo = "El evento se realizará en la fecha " + evento.fechaEvento + ".";
    var idtutores;
    // NOTIFICACIÓN
    //Construcción de cuerpo de la notificación

    // Notificar a los adultos que correspondan a los cursos de los tags/chips
    if (tags.includes("Todos los cursos")) {
      Suscripcion.notificacionMasiva(evento.titulo, this.cuerpo);
    } else {
      Inscripcion.agreggate([
        {
          '$lookup': {
            'from': 'curso',
            'localField': 'idCurso',
            'foreignField': '_id',
            'as': 'icurso'
          }
        }, {
          '$unwind': {
            'path': '$icurso',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$match': {
            '$expr': {
              '$in': [
                '$icurso.curso', [
                  '5A'
                ]
              ]
            }
          }
        }, {
          '$lookup': {
            'from': 'estudiante',
            'localField': 'idEstudiante',
            'foreignField': '_id',
            'as': 'conest'
          }
        }, {
          '$unwind': {
            'path': '$conest',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$unwind': {
            'path': '$conest.adultoResponsable',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$lookup': {
            'from': 'adultoResponsable',
            'localField': 'idAdulto',
            'foreignField': 'string',
            'as': 'conadulto'
          }
        }, {
          '$unwind': {
            'path': '$conadulto',
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$project': {
            '_id': 0,
            'conadulto.idUsuario': 1
          }
        }
      ]).then(response =>{
        response.forEach(conadulto => {
          idtutores.push(conadulto[0].idUsuario);
        });
        Suscripcion.notificacionGrupal(
          idtutores, // Tutores de los cursos seleccionados
          evento.titulo,
          this.cuerpo
        );
      })

    }

    // evento.save().then(() => {
    //   //Completar con código de la notificación COMPLETAR CON LO DE ARRIBA
    //   res.status(201).json({
    //     message: "Evento creado existosamente",
    //     exito: true
    //   });
    // });
  });
});

//Obtiene todos los eventos que estan almacenados en la base de datos
router.get("", (req, res, next) => {
  Evento.find().then(eventos => {
    res.status(200).json({
      eventos: eventos,
      message: "Eventos devuelto existosamente",
      exito: true
    });
  });
});

//Obtiene todos los comentarios de un evento que estan almacenados en la base de datos
//@params: id del evento
router.get("/comentarios", (req, res, next) => {
  Evento.findById(req.query.idEvento).then(evento => {
    res.status(200).json({
      comentarios: evento.comentarios,
      message: "Evento devuelto existosamente",
      exito: true
    });
  });
});

//Publica en la base de datos un comentario
//@params: id del evento
//@params: la descripcion del comentario, el autor junto con el rol que cumple
router.post("/registrarComentario", async (req, res, next) => {
  let apellido = "";
  let nombre = "";
  let idUsuario = "";

  var obtenerDatosUsuario = (rol, emailUsuario) => {
    return new Promise((resolve, reject) => {
      if (rol == "Adulto Responsable") {
        AdultoResponsable.findOne({ email: emailUsuario }).then(usuario => {
          apellido = usuario.apellido;
          nombre = usuario.nombre;
          idUsuario = usuario.idUsuario;
          resolve({ apellido: apellido, nombre: nombre, idUsuario: idUsuario });
        });
      } else if(rol == "Admin"){
        Admin.findOne({ email: emailUsuario }).then(usuario => {
          apellido = usuario.apellido;
          nombre = usuario.nombre;
          idUsuario = usuario.idUsuario;
          resolve({ apellido: apellido, nombre: nombre, idUsuario: idUsuario });
        });
      }else{
        Empleado.findOne({ email: emailUsuario }).then(usuario => {
          apellido = usuario.apellido;
          nombre = usuario.nombre;
          idUsuario = usuario.idUsuario;
          resolve({ apellido: apellido, nombre: nombre, idUsuario: idUsuario });
        });
      }
    });
  };

  var datosUsuario = await obtenerDatosUsuario(
    req.body.rol,
    req.body.emailUsuario
  );

  Evento.findByIdAndUpdate(req.body.idEvento, {
    $push: {
      comentarios: {
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
    imgUrl: req.body.imgUrl,
    autor: req.body.autor
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

router.delete("/eliminarEvento", checkAuthMiddleware, (req, res, next) => {
  Evento.deleteOne({
    titulo: req.query.titulo
  }).exec();
    return res.status(202).json({
      message: "Evento eliminado exitosamente",
      exito: true
  });
});

module.exports = router;
