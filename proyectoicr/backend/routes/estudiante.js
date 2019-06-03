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
    adultoResponsable:null,
  });
  estudiante.save().then(()=> {
    res.status(201).json({
      message: "Estudiante registrado correctamente!"
    });
  })
})

module.exports = router;
