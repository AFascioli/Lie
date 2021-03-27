const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const AdultoResponsable = require("../models/adultoResponsable");
const Estudiante = require("../models/estudiante");
const Inscripcion = require("../models/inscripcion");
const Curso = require("../models/curso");
const ClaseEstado = require("../classes/estado");
const mongoose = require("mongoose");

// Retorna los adultos responsables de un estudiante
router.get("/", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.find(
    {
      estudiantes: { $in: [req.query.idEstudiante] },
      tutor: false,
    },
    { idUsuario: 1, nombre: 1, apellido: 1, _id: 0 }
  )
    .then((adultosResponsables) => {
      if (adultosResponsables.length > 0) {
        adultosResponsables.forEach((adulto) => {
          adulto.seleccionado = false;
        });
        res.status(200).json({
          exito: true,
          message: "Se encontro los adultos responsables del estudiante",
          adultosResponsables: adultosResponsables,
        });
      } else {
        res.status(200).json({
          exito: true,
          message: "El estudiante no tiene adultos responsables registrados",
          adultosResponsables: adultosResponsables,
        });
      }
    })
    .catch((error) => {
      res.status(400).json({
        exito: false,
        message:
          "Ocurrió un error al buscar los adultos responsables del estudiante",
        error: error.message,
      });
    });
});

//Busqueda de un adulto responsable por nombre y apellido ignorando mayusculas
router.get("/nombre", checkAuthMiddleware, (req, res, next) => {
  const nombre = req.query.nombre;
  const apellido = req.query.apellido;
  AdultoResponsable.find({
    nombre: { $regex: new RegExp(nombre, "i") },
    apellido: { $regex: new RegExp(apellido, "i") },
  })
    .then((documents) => {
      res.status(200).json({
        adultosResponsables: documents,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el adulto responsable por nombre",
        error: error.message,
      });
    });
});

//Obtiene un adulto responsable dado un numero y tipo de documento
router.get("/documento", checkAuthMiddleware, (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  AdultoResponsable.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
  })
    .then((adultosResponsables) => {
      res.status(200).json({
        adultosResponsables: adultosResponsables,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener el adulto por documento",
        error: error.message,
      });
    });
});

//Registra un nuevo adulto responsable en la base de datos
router.post("/", checkAuthMiddleware, (req, res) => {
  const adultoResponsable = new AdultoResponsable({
    apellido: req.body.datos.AR.apellido,
    nombre: req.body.datos.AR.nombre,
    tipoDocumento: req.body.datos.AR.tipoDocumento,
    numeroDocumento: req.body.datos.AR.numeroDocumento,
    sexo: req.body.datos.AR.sexo,
    nacionalidad: req.body.datos.AR.nacionalidad,
    fechaNacimiento: req.body.datos.AR.fechaNacimiento,
    telefono: req.body.datos.AR.telefono,
    email: req.body.datos.AR.email,
    tutor: req.body.datos.AR.tutor,
    idUsuario: req.body.datos.AR.idUsuario,
    estudiantes: [],
    preferenciasPush: [
      { nombre: "Retiro Anticipado", acepta: true },
      { nombre: "Creacion de evento", acepta: true },
      { nombre: "Cancelacion de evento", acepta: true },
      { nombre: "Inasistencia", acepta: true },
      { nombre: "Falta 12", acepta: true },
    ],
  });

  adultoResponsable.estudiantes.push(req.body.datos.idEstudiante);
  adultoResponsable
    .save()
    .then((ARGuardado) => {
      Estudiante.findByIdAndUpdate(req.body.datos.idEstudiante, {
        $addToSet: { adultoResponsable: ARGuardado._id },
      }).then(() => {
        res.status(201).json({
          message: "El adulto responsable fue registrado exitosamente",
          exito: true,
        });
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Se presentó un error al querer registrar el adulto responsable",
        error: error.message,
      });
    });
});

//Asocia un adulto responsable a un estudiante
router.post("/estudiante", checkAuthMiddleware, async (req, res) => {
  try {
    for (const idAR of req.body.adultosResponsables) {
      let arFind = await AdultoResponsable.findById(idAR._id);

      arFind.estudiantes.push(req.body.idEstudiante);
      await arFind.save();

      await Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
        $addToSet: { adultoResponsable: arFind._id },
      }).exec();
    }
    res.status(201).json({
      message: "El adulto responsable fue asociado exitosamente",
      exito: true,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Se presentó un error al querer asociar el adulto responsable al estudiante",
      error: error.message,
    });
  }
});

//Retorna nombre, apellido, curso e id de los estudiantes a cargo de un Adulto Responsable
//@params: idUsuario (del AR)
router.get("/estudiantes", checkAuthMiddleware, async (req, res) => {
  let estudiantes = [];
  var obtenerIdsEstudiantes = (idAR) => {
    return new Promise((resolve, reject) => {
      AdultoResponsable.findOne({ idUsuario: idAR }).then(
        (adultoResponsable) => {
          resolve(adultoResponsable.estudiantes);
        }
      );
    });
  };

  var obtenerDatosEstudiantes = (idEstudiante) => {
    return new Promise((resolve, reject) => {
      let datosEstudiante;
      Estudiante.findById(idEstudiante)
        .then(async (estudiante) => {
          datosEstudiante = {
            nombre: estudiante.nombre,
            apellido: estudiante.apellido,
            idEstudiante: estudiante._id,
            curso: null,
          };
          const idEstadoActiva = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Activa"
          );
          let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
            "Inscripcion",
            "Suspendido"
          );
          Inscripcion.findOne({
            idEstudiante: idEstudiante,
            estado: {
              $in: [
                mongoose.Types.ObjectId(idEstadoActiva),
                mongoose.Types.ObjectId(idEstadoSuspendido),
              ],
            },
          }).then((inscripcion) => {
            if (inscripcion != null) {
              Curso.findById(inscripcion.idCurso).then((curso) => {
                datosEstudiante.curso = curso.nombre;
                resolve(datosEstudiante);
              });
            } else {
              datosEstudiante.curso = null;
              resolve(datosEstudiante);
            }
          });
        })
        .catch((error) => {
          res.status(500).json({
            message:
              "Se presentó un error al querer obtener los datos del estudiante",
            error: error.message,
          });
        });
    });
  };

  let idsEstudiantes = await obtenerIdsEstudiantes(req.query.idUsuario);

  try {
    for (const idEstudiante of idsEstudiantes) {
      let datosEstudiante = await obtenerDatosEstudiantes(idEstudiante);
      estudiantes.push(datosEstudiante);
    }
    if (estudiantes.length != 0) {
      res
        .status(200)
        .json({ estudiantes: estudiantes, exito: true, message: "exito" });
    } else {
      res
        .status(200)
        .json({ estudiantes: estudiantes, exito: false, message: "error" });
    }
  } catch (error) {
    res.status(500).json({
      message:
        "Se presentó un error al querer obtener los datos del estudiante",
      error: error.message,
    });
  }
});

router.get("/preferencias", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findOne({ idUsuario: req.query.idUsuarioAR })
    .then((adultoR) => {
      res.status(200).json({
        message: "Preferencias buscadas correctamente",
        exito: true,
        preferenciasPush: adultoR.preferenciasPush,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Se presentó un error al querer obtener las preferencias",
        error: error.message,
      });
    });
});

router.post("/preferencias", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findOneAndUpdate(
    { idUsuario: req.body.idUsuarioAR },
    { preferenciasPush: req.body.preferencias }
  )
    .then(() => {
      res.status(200).json({
        message: "Preferencias actualizadas correctamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al actualizar las preferencias",
        error: error.message,
      });
    });
});

router.post("/modificar", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findByIdAndUpdate(req.body.adultoResponsable._id, {
    apellido: req.body.adultoResponsable.apellido,
    nombre: req.body.adultoResponsable.nombre,
    tipoDocumento: req.body.adultoResponsable.tipoDocumento,
    numeroDocumento: req.body.adultoResponsable.numeroDocumento,
    sexo: req.body.adultoResponsable.sexo,
    nacionalidad: req.body.adultoResponsable.nacionalidad,
    fechaNacimiento: req.body.adultoResponsable.fechaNacimiento,
    telefono: req.body.adultoResponsable.telefono,
    email: req.body.adultoResponsable.email,
    tutor: req.body.adultoResponsable.tutor,
  })
    .then((adulto) => {
      res.status(200).json({
        message: "Adulto modificado correctamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer modificar el adulto responsable",
        error: error.message,
      });
    });
});

module.exports = router;
