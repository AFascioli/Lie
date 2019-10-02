const express = require("express");
const router = express.Router();
const AdultoResponsable = require("../models/adultoResponsable");
const Estudiante = require("../models/estudiante");
const checkAuthMiddleware = require("../middleware/check-auth");

//Registra un nuevo adulto responsable en la base de datos
router.post("/", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findOne({
    tipoDocumento: req.body.AR.tipoDocumento,
    numeroDocumento: req.body.AR.numeroDocumento
  }).then(AR => {
    console.log(AR);
    if (AR) {
      return res.status(200).json({
        message: "El adulto responsable ya esta registrado",
        exito: true
      });
    } else {
      const adultoResponsable = new AdultoResponsable({
        apellido: req.body.AR.apellido,
        nombre: req.body.AR.nombre,
        tipoDocumento: req.body.AR.tipoDocumento,
        numeroDocumento: req.body.AR.numeroDocumento,
        sexo: req.body.AR.sexo,
        nacionalidad: req.body.AR.nacionalidad,
        fechaNacimiento: req.body.AR.fechaNacimiento,
        telefono: req.body.AR.telefono,
        email: req.body.AR.email,
        tutor: req.body.AR.tutor,
        idUsuario: req.body.AR.idUsuario,
        estudiantes: [req.body.idEstudiante]
      });
      adultoResponsable
        .save()
        .then(ARGuardado => {
          // Estudiante.findById(req.body.idEstudiante).then( estudiante => {
          //   estudiante.adultoResponsable.push(ARGuardado._id);
          //   estudiante.save().exec();
          // });

          Estudiante.findByIdAndUpdate(req.body.idEstudiante, {
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
