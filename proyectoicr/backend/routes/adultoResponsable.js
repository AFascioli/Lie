const express = require("express");
const router = express.Router();
const AdultoResponsable = require("../models/adultoResponsable");
const Estudiante = require("../models/estudiante");
const checkAuthMiddleware = require("../middleware/check-auth");

//Registra un nuevo adulto responsable en la base de datos
router.post("/", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findOne({
    tipoDocumento: req.body.datos.AR.tipoDocumento,
    numeroDocumento: req.body.datos.AR.numeroDocumento
  }).then(AR => {
    if (AR) {
      return res.status(200).json({
        message: "El adulto responsable ya esta registrado",
        exito: false
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
        estudiantes: []
      });
      adultoResponsable.estudiantes.push(req.body.datos.idEstudiante);
      console.log(adultoResponsable);
      adultoResponsable
        .save()
        .then(ARGuardado => {
          Estudiante.findByIdAndUpdate(req.body.datos.idEstudiante, {
            $addToSet: { adultoResponsable: ARGuardado._id }
          }).then(() => {
            res.status(201).json({
              message: "El adulto responsable fue registrado exitosamente",
              exito: true
            });
          });
        })
        .catch(err =>
          console.log(
            "Se presentó un error al querer almacenar un adultoResponsable en la base de datos" +
              err
          )
        );
    }
  });
});

module.exports = router;
