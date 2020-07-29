const express = require("express");
const router = express.Router();
const AdultoResponsable = require("../models/adultoResponsable");
const Estudiante = require("../models/estudiante");
const checkAuthMiddleware = require("../middleware/check-auth");
const Inscripcion = require("../models/inscripcion");
const Curso = require("../models/curso");
const usuario = require("../models/usuario");
const adultoResponsable = require("../models/adultoResponsable");

// Retorna los adultos responsables de un estudiante
router.get("/", (req, res) => {
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
    .catch((e) => {
      res.status(400).json({
        exito: false,
        message:
          "Ocurrió un error al buscar los adultos responsables del estudiante" +
          e,
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
    .catch(() => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el adulto responsable por nombre",
      });
    });
});

//Obtiene un estudiante dado un numero y tipo de documento
router.get("/documento", checkAuthMiddleware, (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  AdultoResponsable.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
  })
    .then((documents) => {
      res.status(200).json({
        adultosResponsables: documents,
      });
    })
    .catch(() => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el estudiante por documento",
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
    .catch((e) => {
      res.status(500).json({
        message:
          "Se presentó un error al querer registrar el adulto responsable. El error fue el siguiente: " +
          e,
      });
    });
});

//Asocia un adulto responsable a un estudiante
router.post("/estudiante", checkAuthMiddleware, (req, res) => {
  for (const idAR of req.body.adultosResponsables) {
    AdultoResponsable.findById(idAR._id).then(async (adultoResponsable) => {
      await adultoResponsable.estudiantes.push(req.body.idEstudiante);
      await adultoResponsable.save().then((ARGuardado) => {
        Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
          $addToSet: { adultoResponsable: ARGuardado._id },
        }).exec();
      });
    });
  }
  res.status(201).json({
    message: "El adulto responsable fue asociado exitosamente",
    exito: true,
  });
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
        .then((estudiante) => {
          datosEstudiante = {
            nombre: estudiante.nombre,
            apellido: estudiante.apellido,
            idEstudiante: estudiante._id,
            curso: null,
          };
          Inscripcion.findOne({
            idEstudiante: idEstudiante,
            activa: true,
          }).then((inscripcion) => {
            if (inscripcion != null) {
              Curso.findById(inscripcion.idCurso).then((curso) => {
                datosEstudiante.curso = curso.nombre;
                resolve(datosEstudiante);
              });
            } else {
              datosEstudiante.curso=null;
              resolve(datosEstudiante);
            }
          });
        })
        .catch((error) => {
          res.status(500).json({
            message:
              "Se presentó un error al querer obtener los datos del estudiante. El error fue el siguiente: " +
              error,
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
      res.json({ estudiantes: estudiantes, exito: true, message: "exito" });
    } else {
      res.json({ estudiantes: estudiantes, exito: false, message: "error" });
    }
  } catch (error) {
    res.status(500).json({
      message:
        "Se presentó un error al querer obtener los datos del estudiante. El error fue el siguiente: " +
        error,
    });
  }
});

router.get("/preferencias", (req, res) => {
  AdultoResponsable.findOne({ idUsuario: req.query.idUsuarioAR }).then(
    (adultoR) => {
      res.status(200).json({
        message: "Preferencias buscadas correctamente",
        exito: true,
        preferenciasPush: adultoR.preferenciasPush,
      });
    }
  );
});

router.post("/preferencias", (req, res) => {
  AdultoResponsable.findOneAndUpdate(
    { idUsuario: req.body.idUsuarioAR },
    { preferenciasPush: req.body.preferencias }
  ).then((adultoR) => {
    res.status(200).json({
      message: "Preferencias actualizadas correctamente",
      exito: true,
    });
  }).catch(error =>{
    res.status(200).json({
      message: "Ocurrió un error al actualizar las preferencias",
      exito: false,
    });
  });
});

module.exports = router;
