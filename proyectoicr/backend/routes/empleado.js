const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Empleado = require("../models/empleado");
const Inscripcion = require("../models/inscripcion");
const checkAuthMiddleware = require("../middleware/check-auth");
const ClaseEstado = require("../classes/estado");

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
    idUsuario: req.body.idUsuario,
  });
  empleado
    .save()
    .then(() => {
      res.status(201).json({
        message: "El empleado fue registrado exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer registrar el empleado",
        error: error.message,
      });
    });
});

//Retorna todos los docentes de la institucion
router.get("/docente", checkAuthMiddleware, (req, res) => {
  Empleado.find({ tipoEmpleado: "Docente" })
    .select("nombre apellido")
    .then((docentes) => {
      res.status(201).json({
        docentes: docentes,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener todos los docentes de la institucion",
        error: error.message,
      });
    });
});

//Obtiene la id del empleado dada la idUsuario
router.get("/id", checkAuthMiddleware, (req, res) => {
  Empleado.findOne({ idUsuario: req.query.idUsuario })
    .then((empleado) => {
      if (empleado) {
        res.status(200).json({
          exito: true,
          message: "Id del empleado obtenida correctamente",
          id: empleado._id,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener la id del empleado dada la id de usuario",
        error: error.message,
      });
    });
});

// Retorna todos los docentes que enseñan en el curso del estudiante
//@params: idEstudiante del cual buscar los docentes
router.get("/estudiante", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: mongoose.Types.ObjectId(idEstadoActiva),
      },
    },
    {
      $lookup: {
        from: "curso",
        localField: "idCurso",
        foreignField: "_id",
        as: "datosCurso",
      },
    },
    {
      $lookup: {
        from: "materiasXCurso",
        localField: "datosCurso.materias",
        foreignField: "_id",
        as: "datosMXC",
      },
    },
    {
      $lookup: {
        from: "empleado",
        localField: "datosMXC.idDocente",
        foreignField: "_id",
        as: "datosDocente",
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "datosMXC.idMateria",
        foreignField: "_id",
        as: "datosMateria",
      },
    },
    {
      $lookup: {
        from: "usuario",
        localField: "datosDocente.idUsuario",
        foreignField: "_id",
        as: "datosUsuario",
      },
    },
    {
      $project: {
        "datosDocente.nombre": 1,
        "datosDocente.apellido": 1,
        "datosMateria.nombre": 1,
        "datosUsuario._id": 1,
      },
    },
  ])
    .then((resultado) => {
      let docentes = [];
      for (let index = 0; index < resultado[0].datosDocente.length; index++) {
        let docente = {
          apellido: resultado[0].datosDocente[index].apellido,
          nombre: resultado[0].datosDocente[index].nombre,
          materia: resultado[0].datosMateria[index].nombre,
          idUsuario: resultado[0].datosUsuario[index]._id,
          seleccionado: false,
        };
        docentes.push(docente);
      }
      res.status(200).json({
        message: "Docentes obtenidos correctamente",
        exito: true,
        docentes: docentes,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los docentes de un estudiante",
        error: error.message,
      });
    });
});

module.exports = router;
