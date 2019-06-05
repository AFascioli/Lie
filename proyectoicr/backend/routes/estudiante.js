const express = require("express");
const router = express.Router();
const Estudiante = require("../models/estudiante");

router.post("", (req, res, next) => {
  const estudiante = new Estudiante({
    apellido: req.body.apellido,
    nombre:req.body.nombre,
    tipoDocumento:req.body.tipoDocumento,
    numeroDocumento:req.body.numeroDocumento,
    cuil:req.body.cuil,
    sexo:req.body.sexo,
    calle:req.body.calle,
    numeroCalle:req.body.numeroCalle,
    piso:req.body.piso,
    departamento:req.body.departamento,
    provincia:req.body.provincia,
    localidad:req.body.localidad,
    codigoPostal:req.body.codigoPostal,
    nacionalidad:req.body.nacionalidad,
    provinciaNacimiento:req.body.provinciaNacimiento,
    localidadNacimiento:req.body.localidadNacimiento,
    fechaNacimiento:req.body.fechaNacimiento,
    estadoCivil:req.body.estadoCivil,
    telefonoFijo:req.body.telefonoFijo,
    adultoResponsable:"null",
  });
  estudiante.save().then(()=> {
    res.status(201).json({
      message: "Estudiante registrado correctamente!"
    });
  });
});

router.get("/documento", (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;
  Estudiante.find({tipoDocumento: tipo, numeroDocumento: numero}).then(documents => {
    console.log("Backend path "+req.headers+req.body);
    res.status(200).json({
      estudiantes: documents
    });
  });
});

module.exports = router;
