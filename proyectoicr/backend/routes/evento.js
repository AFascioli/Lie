const express = require("express");
const Evento = require("../models/evento");
const router = express.Router();
const AdultoResponsable = require("../models/adultoResponsable");
const Empleado = require("../models/empleado");
const checkAuthMiddleware = require("../middleware/check-auth");
const multer = require("multer");
const Usuario = require("../models/usuario");
const path = require("path");
const Admin = require("../models/administrador");
const GridFsStorage = require("multer-gridfs-storage");
//const Suscripcion = require("../classes/suscripcion");
//const Inscripcion = require("../models/inscripcion");
//const mongoose = require("mongoose");

const storage = new GridFsStorage({
  url: "mongodb://127.0.0.1:27017/icr-local",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: "imagen",
      filename: `${Date.now()}-${file.originalname}`
    };
  }
});

var upload = multer({ storage: storage }).single("image");

//Registra el evento en la base de datos
//@params: evento a publicar
router.post("/registrar", upload, (req, res, next) => {
  Usuario.findOne({ email: req.body.autor })
    .then(usuario => {
      if (req.file != null && req.file.filename != null) {
        const evento = new Evento({
          titulo: req.body.titulo,
          descripcion: req.body.descripcion,
          fechaEvento: req.body.fechaEvento,
          horaInicio: req.body.horaInicio,
          horaFin: req.body.horaFin,
          tags: req.body.tags,
          filename: req.file.filename,
          autor: usuario._id
        });
        evento
          .save()
          .then(() => {
            // this.notificarPorEvento(
            //   this.evento.tags,
            //   this.evento.titulo,
            //   "El evento se realizará en la fecha " + evento.fechaEvento + "."
            // );

            res.status(201).json({
              message: "Evento creado existosamente",
              exito: true
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico"
            });
          });
      } else {
        Usuario.findOne({ email: req.body.autor })
          .then(usuario => {
            const evento = new Evento({
              titulo: req.body.titulo,
              descripcion: req.body.descripcion,
              fechaEvento: req.body.fechaEvento,
              horaInicio: req.body.horaInicio,
              horaFin: req.body.horaFin,
              tags: req.body.tags,
              autor: usuario._id
            });
            evento
              .save()
              .then(() => {
                //Completar con código de la notificación COMPLETAR CON LO DE ARRIBA
                res.status(201).json({
                  message: "Evento creado existosamente",
                  exito: true
                });
              })
              .catch(() => {
                res.status(500).json({
                  message: "Mensaje de error especifico"
                });
              });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico"
            });
          });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Registra el evento en la base de datos
//@params: evento a publicar
router.post("/modificar", upload, (req, res) => {
  if (req.file != null && req.file.filename != null) {
    //console.log(req.body);
    Evento.findByIdAndUpdate(req.body._id, {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fechaEvento: req.body.fechaEvento,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
      tags: req.body.tags,
      filename: req.file.filename,
      autor: req.body.idAutor
    })
      .exec()
      .then(() => {
        //Completar con código de la notificación COMPLETAR CON LO DE ARRIBA
        res.status(201).json({
          message: "Evento modificado existosamente",
          exito: true
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "No se pudo modificar el evento correctamente"
        });
      });
  } else {
    Evento.findByIdAndUpdate(req.body._id, {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fechaEvento: req.body.fechaEvento,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
      tags: req.body.tags,
      autor: req.body.idAutor
    })
      .exec()
      .then(() => {
        //Completar con código de la notificación COMPLETAR CON LO DE ARRIBA
        res.status(201).json({
          message: "Evento modificado existosamente",
          exito: true
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "No se pudo modificar el evento correctamente"
        });
      });
  }
});

//Obtiene todos los eventos que estan almacenados en la base de datos
router.get("", (req, res, next) => {
  Evento.find()
    .then(eventos => {
      res.status(200).json({
        eventos: eventos,
        message: "Eventos devuelto existosamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Retorna la imagen de un evento dada su url
router.get("/imagenes", (req, res, next) => {
  res.sendFile(path.join(__dirname, "../images", req.query.imgUrl));
});

//Obtiene todos los comentarios de un evento que estan almacenados en la base de datos
//@params: id del evento
router.get("/comentarios", (req, res, next) => {
  Evento.findById(req.query.idEvento)
    .then(evento => {
      res.status(200).json({
        comentarios: evento.comentarios,
        message: "Evento devuelto existosamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
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
        AdultoResponsable.findOne({ email: emailUsuario })
          .then(usuario => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({
              apellido: apellido,
              nombre: nombre,
              idUsuario: idUsuario
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico"
            });
          });
      } else if (rol == "Admin") {
        Admin.findOne({ email: emailUsuario })
          .then(usuario => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({
              apellido: apellido,
              nombre: nombre,
              idUsuario: idUsuario
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico"
            });
          });
      } else {
        Empleado.findOne({ email: emailUsuario })
          .then(usuario => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({
              apellido: apellido,
              nombre: nombre,
              idUsuario: idUsuario
            });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico"
            });
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

// //Modifica el evento en la base de datos
// //@params: evento a publicar
// router.patch("/editar", upload, (req, res, next) => {
//   Evento.findByIdAndUpdate(req.body._id, {
//     titulo: req.body.titulo,
//     descripcion: req.body.descripcion,
//     fechaEvento: req.body.fechaEvento,
//     horaInicio: req.body.horaInicio,
//     horaFin: req.body.horaFin,
//     tags: req.body.tags,
//     imgUrl: req.file.filename,
//     autor: req.body.autor
//   });
//   console
//     .log(horaFin)
//     .then(() => {
//       res.status(200).json({
//         message: "Evento modificado exitosamente",
//         exito: true
//       });
//     })
//     .catch(() => {
//       res.status(200).json({
//         message: "Ocurrió un problema al intentar modificar el evento",
//         exito: false
//       });
//     });
// });

router.delete("/eliminarEvento", checkAuthMiddleware, (req, res, next) => {
  Evento.findById(req.query._id).then(evento => {
    this.notificarPorEvento(
      evento.tags,
      evento.titulo,
      "Se ha cancelado el evento."
    );
  });

  Evento.findByIdAndDelete({
    _id: req.query._id
  })
    .exec()
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
  return res.status(202).json({
    message: "Evento eliminado exitosamente",
    exito: true
  });
});

router.delete("/eliminarComentario", checkAuthMiddleware, (req, res, next) => {
  Evento.findByIdAndUpdate({
    _id: req.query.idEvento
  }).then(eventoEncontrado => {
    for (let i = 0; i < eventoEncontrado.comentarios.length; i++) {
      if (eventoEncontrado.comentarios[i]._id == req.query.idComentario) {
        eventoEncontrado.comentarios.splice(i, 1);
        eventoEncontrado.save();
      }
    }
  });

  return res.status(202).json({
    message: "Cometario eliminado exitosamente",
    exito: true
  });
});

notificarPorEvento = function(tags, titulo, cuerpo) {
  //Notificar a los adultos que correspondan a los cursos de los tags/chips
  if (tags.includes("Todos los cursos")) {
    Suscripcion.notificacionMasiva(evento.titulo, this.cuerpo);
  } else {
    Inscripcion.agreggate([
      {
        $lookup: {
          from: "curso",
          localField: "idCurso",
          foreignField: "_id",
          as: "icurso"
        }
      },
      {
        $unwind: {
          path: "$icurso",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          $expr: {
            $in: ["$icurso.curso", ["5A"]]
          }
        }
      },
      {
        $lookup: {
          from: "estudiante",
          localField: "idEstudiante",
          foreignField: "_id",
          as: "conest"
        }
      },
      {
        $unwind: {
          path: "$conest",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $unwind: {
          path: "$conest.adultoResponsable",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: "adultoResponsable",
          localField: "idAdulto",
          foreignField: "string",
          as: "conadulto"
        }
      },
      {
        $unwind: {
          path: "$conadulto",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: 0,
          "conadulto.idUsuario": 1
        }
      }
    ]).then(response => {
      let idtutores;
      response.forEach(conadulto => {
        idtutores.push(conadulto[0].idUsuario);
      });
      Suscripcion.notificacionGrupal(
        idtutores, // Tutores de los cursos seleccionados
        titulo,
        cuerpo
      );

      console.log("Envío de notificación");
      console.log("tags: ", tags);
      console.log(titulo);
      console.log(cuerpo);
      console.log("Tutores a notif: ", idtutores);
    });
  }
};

module.exports = router;
