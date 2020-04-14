const express = require("express");
const router = express.Router();
const AdultoResponsable = require("../models/adultoResponsable");
const Estudiante = require("../models/estudiante");
const checkAuthMiddleware = require("../middleware/check-auth");
const Inscripcion = require("../models/inscripcion");
const Curso = require("../models/curso");

//Registra un nuevo adulto responsable en la base de datos
router.post("/", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findOne({
    tipoDocumento: req.body.datos.AR.tipoDocumento,
    numeroDocumento: req.body.datos.AR.numeroDocumento,
  }).then((AR) => {
    if (AR) {
      return res.status(200).json({
        message: "El adulto responsable ya esta registrado",
        exito: false,
      });
    } else {
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
    }
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
              resolve(null);
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

module.exports = router;
