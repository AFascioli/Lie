const express = require("express");
const AdultoResponsable = require("../models/adultoResponsable");
const router = express.Router();

//Registra un nuevo adulto responsable en la base de datos
router.post("", checkAuthMiddleware,(req, res, next) => {
  const adultoResponsable= new AdultoResponsable({
    apellido: req.body.apellido,
    nombre: req.body.nombre,
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
    sexo: req.body.sexo,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    telefono: req.body.telefono,
    tutor: req.body.tutor,
    idUsuario: req.body.idUsuario
  });
  adultoResponsable
    .save()
    .then(() => {
      res.status(201).json({
        message: "El adulto responsable fue registrado exitosamente",
        exito: true
      });
    })
    .catch(err => console.log("Se presentó un error al querer almacenar un estudiante en la base de datos" + err));
});

module.exports = router;
