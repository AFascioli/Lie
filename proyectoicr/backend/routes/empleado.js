const express = require("express");
const router = express.Router();
const Empleado = require("../models/empleado");
const checkAuthMiddleware = require("../middleware/check-auth");

//Registra un nuevo empleado en la base de datos
//@params: datos del empleado para ser creado
router.post("/", checkAuthMiddleware, (req, res) => {
  const empleado = new Empleado({
    apellido: req.body.apellido,
    nombre: req.body.nombre,
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
    sexo: req.body.sexo,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    telefono: req.body.telefono,
    email: req.body.email,
    tipoEmpleado: req.body.tipoEmpleado,
    idUsuario: req.body.idUsuario
  });
  empleado
    .save()
    .then(() => {
      res.status(201).json({
        message: "El empleado fue registrado exitosamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Retorna todos los docentes de la institucion
router.get("/docente", checkAuthMiddleware, (req, res) => {
  Empleado.find({ tipoEmpleado: "Docente" })
    .select("nombre apellido")
    .then(docentes => {
      res.status(201).json({
        docentes: docentes
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico"
      });
    });
});

//Obtiene la id del empleado dada la idUsuario
router.get("/id", checkAuthMiddleware, (req, res) => {
  Empleado.findOne({idUsuario: req.query.idUsuario}).then(empleado => {
     if(empleado){
       res.status(200).json({
         exito: true,
         message: "Id obtenida correctamente",
         id: empleado._id
       })
     }
  }).catch(() => {
    res.status(500).json({
      message: "Mensaje de error especifico",
    });
  });
});

module.exports = router;
