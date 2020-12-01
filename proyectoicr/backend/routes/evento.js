const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Ambiente = require("../assets/ambiente");
const GridFsStorage = require("multer-gridfs-storage");
const checkAuthMiddleware = require("../middleware/check-auth");
const clasificador = require("../middleware/clasificador");
const Evento = require("../models/evento");
const ImagenFiles = require("../models/imagen.files");
const ImagenChunks = require("../models/imagen.chunks");
const AdultoResponsable = require("../models/adultoResponsable");
const Empleado = require("../models/empleado");
const Usuario = require("../models/usuario");
const Inscripcion = require("../models/inscripcion");
const Administrador = require("../models/administrador");
const Suscripcion = require("../classes/suscripcion");
const ClaseEstado = require("../classes/estado");

const storage = new GridFsStorage({
  url: Ambiente.stringDeConexion,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: "imagen",
      filename: `${Date.now()}-${file.originalname}`,
    };
  },
});

var upload = multer({ storage: storage }).array("images", 15);

//Registra el evento en la base de datos
//@params: evento a publicar
router.post(
  "/registrar",
  checkAuthMiddleware,
  upload,
  async (req, res, next) => {
    leerFilenames = () => {
      return new Promise((resolve, reject) => {
        let filenames = [];
        for (let index = 0; index < req.files.length; index++) {
          filenames.push(req.files[index].filename);
        }
        if (filenames.length == req.files.length) {
          resolve(filenames);
        } else {
          reject("No se pudo obtener los nombres de las imagenes.");
        }
      });
    };

    Usuario.findOne({ email: req.body.autor })
      .then(async (usuario) => {
        if (req.files != null) {
          const evento = new Evento({
            titulo: req.body.titulo,
            descripcion: req.body.descripcion,
            fechaEvento: req.body.fechaEvento,
            horaInicio: req.body.horaInicio,
            horaFin: req.body.horaFin,
            tags: req.body.tags,
            filenames: await leerFilenames(),
            autor: usuario._id,
          });
          evento.save().then((eventoCreado) => {
            let fechaDelEvento = new Date(eventoCreado.fechaEvento);
            notificarPorEvento(
              eventoCreado.tags,
              eventoCreado.titulo,
              "El evento se realizara el día " +
                fechaDelEvento.getDate() +
                "/" +
                (fechaDelEvento.getMonth() + 1) +
                "/" +
                fechaDelEvento.getFullYear() +
                "."
            );
            res.status(201).json({
              message: "Evento creado exitosamente",
              exito: true,
            });
          });
        } else {
          Usuario.findOne({ email: req.body.autor }).then((usuario) => {
            const evento = new Evento({
              titulo: req.body.titulo,
              descripcion: req.body.descripcion,
              fechaEvento: req.body.fechaEvento,
              horaInicio: req.body.horaInicio,
              horaFin: req.body.horaFin,
              tags: req.body.tags,
              autor: usuario._id,
            });
            evento.save().then((eventoCreado) => {
              let fechaDelEvento = new Date(eventoCreado.fechaEvento);
              notificarPorEvento(
                eventoCreado.tags,
                eventoCreado.titulo,
                "El evento se realizara el día " +
                  fechaDelEvento.getDate() +
                  "/" +
                  (fechaDelEvento.getMonth() + 1) +
                  "/" +
                  fechaDelEvento.getFullYear() +
                  "."
              );
              res.status(201).json({
                message: "Evento registrado exitosamente",
                exito: true,
              });
            });
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          message: "Se presentaron problemas al querer registrar un evento",
          error: error.message,
        });
      });
  }
);

//Registra el evento en la base de datos
//@params: evento a publicar
router.post(
  "/modificar",
  checkAuthMiddleware,
  upload,
  async (req, res, next) => {
    leerFilenames = () => {
      return new Promise((resolve, reject) => {
        let filenamesEvento = [];
        if (req.body.filenames) {
          filenamesEvento = req.body.filenames;
        }
        // Se sacan los filenames borrados
        if (filenamesEvento.length > 0 && req.body.filenamesBorrados != "null");
        {
          filenamesEvento = filenamesEvento.filter((filename) => {
            if (!req.body.filenamesBorrados.includes(filename)) {
              return true;
            } else {
              return false;
            }
          });
        }
        // Se agregan los filenames nuevos
        for (let index = 0; index < req.files.length; index++) {
          filenamesEvento.push(req.files[index].filename);
        }
        resolve(filenamesEvento);
      });
    };

    borrarImagenes = async (filenamesBorrados) => {
      return new Promise(async (resolve, reject) => {
        for (let index = 0; index < filenamesBorrados.lenght; index++) {
          await ImagenFiles.findOneAndDelete({
            filename: filenamesBorrados[index],
          }).then((file) => {
            ImagenChunks.deleteMany({
              files_id: file._id,
            }).exec();
          });
        }
        resolve(true);
      });
    };

    await borrarImagenes(req.body.filenamesBorrados);
    let filenames = await leerFilenames();

    Evento.findByIdAndUpdate(req.body._id, {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      fechaEvento: req.body.fechaEvento,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
      tags: req.body.tags,
      filenames: filenames,
      autor: req.body.idAutor,
    })
      .exec()
      .then((eventoModificado) => {
        eventoModificado
          .save()
          .then(() => {
            // this.notificarPorEvento(
            //   this.evento.tags,
            //   this.evento.titulo,
            //   "El evento se realizará en la fecha " + evento.fechaEvento + "."
            // );
            res.status(201).json({
              message: "Evento modificado exitosamente",
              exito: true,
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Ocurrió un error al querer modificar un evento",
              error: error.message,
            });
          });
      });
  }
);

//Obtiene todos los eventos que estan almacenados en la base de datos
router.get("", checkAuthMiddleware, (req, res, next) => {
  Evento.find()
    .then((eventos) => {
      res.status(200).json({
        eventos: eventos,
        message: "Eventos devuelto exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener los eventos",
        error: error.message,
      });
    });
});

//Retorna la imagen de un evento dada su url
router.get("/imagenes", checkAuthMiddleware, (req, res, next) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "../images", req.query.imgUrl));
  } catch (error) {
    res.status(500).json({
      message: "Ocurrió un error al querer obtener la imagen de un evento",
      error: error.message,
    });
  }
});

//Obtiene todos los comentarios de un evento que estan almacenados en la base de datos
//@params: id del evento
router.get("/comentarios", checkAuthMiddleware, (req, res, next) => {
  Evento.findById(req.query.idEvento)
    .then((evento) => {
      res.status(200).json({
        comentarios: evento.comentarios,
        message: "Evento devuelto exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los comentarios del evento",
        error: error.message,
      });
    });
});

//Publica en la base de datos un comentario
//@params: id del evento
//@params: la descripcion del comentario, el autor junto con el rol que cumple
router.post(
  "/registrarComentario",
  checkAuthMiddleware,
  clasificador,
  async (req, res, next) => {
    let apellido = "";
    let nombre = "";
    let idUsuario = "";

    var obtenerDatosUsuario = (rol, emailUsuario) => {
      return new Promise((resolve, reject) => {
        if (rol == "AdultoResponsable") {
          AdultoResponsable.findOne({ email: emailUsuario }).then((usuario) => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({
              apellido: apellido,
              nombre: nombre,
              idUsuario: idUsuario,
            });
          });
        } else if (rol == "Admin") {
          Administrador.findOne({ email: emailUsuario }).then((usuario) => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({
              apellido: apellido,
              nombre: nombre,
              idUsuario: idUsuario,
            });
          });
        } else {
          Empleado.findOne({ email: emailUsuario }).then((usuario) => {
            apellido = usuario.apellido;
            nombre = usuario.nombre;
            idUsuario = usuario.idUsuario;
            resolve({
              apellido: apellido,
              nombre: nombre,
              idUsuario: idUsuario,
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
          cuerpo: req.body.comentario.cuerpo,
          fecha: req.body.comentario.fecha,
          idUsuario: datosUsuario.idUsuario,
        },
      },
    })
      .then(() => {
        res.status(200).json({
          message: "Se ha registrado el comentario correctamente",
          exito: true,
          nombre: nombre,
          apellido: apellido,
        });
      })
      .catch((error) => {
        res.status(500).json({
          message: "Ocurrió un error al querer registrar comentario",
          error: error.message,
        });
      });
  }
);

router.delete("/eliminarEvento", checkAuthMiddleware, (req, res, next) => {
  Evento.findByIdAndDelete(req.query._id)
    .then(async (evento) => {
      let largo = evento.filenames.length;
      for (let index = 0; index < largo; index++) {
        await ImagenFiles.findOneAndDelete({
          filename: evento.filenames[index],
        }).then((file) => {
          ImagenChunks.deleteMany({
            files_id: file._id,
          }).exec();
        });
      }
      notificarPorEvento(
        evento.tags,
        evento.titulo,
        "Ha sido cancelado." //No cambiar texto, se usa en notificarEvento
      );
      return res.status(202).json({
        message: "Evento eliminado exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al eliminar el evento",
        error: error.message,
      });
    });
});

router.delete("/eliminarComentario", checkAuthMiddleware, (req, res, next) => {
  try {
    Evento.findById({
      _id: req.query.idEvento,
    }).then((eventoEncontrado) => {
      for (let i = 0; i < eventoEncontrado.comentarios.length; i++) {
        if (eventoEncontrado.comentarios[i]._id == req.query.idComentario) {
          eventoEncontrado.comentarios.splice(i, 1);
          eventoEncontrado.save();
        }
      }
    });

    return res.status(202).json({
      message: "Cometario eliminado exitosamente",
      exito: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Ocurrió un error al eliminar el comentario",
      error: error.message,
    });
  }
});

notificarPorEvento = async function (tags, titulo, cuerpo) {
  //Notificar a los adultos que correspondan a los cursos de los tags/chips
  if (tags.includes("Todos los cursos")) {
    Suscripcion.notificacionMasiva(titulo, this.cuerpo);
  } else {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    Inscripcion.aggregate([
      {
        $lookup: {
          from: "curso",
          localField: "idCurso",
          foreignField: "_id",
          as: "icurso",
        },
      },
      {
        $unwind: {
          path: "$icurso",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          $expr: {
            $in: ["$icurso.nombre", tags],
          },
          estado: mongoose.Types.ObjectId(idEstadoActiva),
        },
      },
      {
        $lookup: {
          from: "estudiante",
          localField: "idEstudiante",
          foreignField: "_id",
          as: "conest",
        },
      },
      {
        $unwind: {
          path: "$conest",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $unwind: {
          path: "$conest.adultoResponsable",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "adultoResponsable",
          localField: "conest.adultoResponsable",
          foreignField: "_id",
          as: "conadulto",
        },
      },
      {
        $unwind: {
          path: "$conadulto",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          "conadulto.idUsuario": 1,
        },
      },
    ]).then(async (response) => {
      let idtutores = [];
      response.forEach((conadulto) => {
        idtutores.push(conadulto.conadulto.idUsuario);
      });
      let idsUsuarios = [];
      if (cuerpo == "Ha sido cancelado.") {
        idsUsuarios = await Suscripcion.filtrarARPorPreferencias(
          idtutores,
          "Cancelacion de evento"
        );
      } else {
        idsUsuarios = await Suscripcion.filtrarARPorPreferencias(
          idtutores,
          "Creacion de evento"
        );
      }
      Suscripcion.notificacionGrupal(idsUsuarios, titulo, cuerpo);
    });
  }
};

//Retorna datos de los eventos dado una string que tienen multiples cursos
//@params: cursos (ej: "2A,5A")
router.get("/curso", checkAuthMiddleware, (req, res) => {
  let cursos = req.query.cursos.split(",");
  cursos.push("Todos los cursos");
  Evento.find(
    { tags: { $in: cursos } },
    { tags: 1, titulo: 1, fechaEvento: 1, horaInicio: 1, horaFin: 1 }
  )
    .then((eventos) => {
      res.status(200).json({ eventos: eventos, exito: true, message: "exito" });
    })
    .catch((error) => {
      res.status(500).json({
        error: "Ocurrió un error al querer obtener los datos de los eventos",
        error: error.message,
      });
    });
});

//Dada una id de evento retorna todos sus datos
//@params: idEvento
router.get("/id", checkAuthMiddleware, (req, res) => {
  Evento.findById(req.query.idEvento)
    .then((evento) => {
      if (evento) {
        res.status(200).json({ evento: evento, exito: true, message: "exito" });
      } else {
        res.status(200).json({ evento: null, exito: true, message: "exito" });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrio un error al querer obtener el evento",
        error: error.message,
      });
    });
});

module.exports = router;
