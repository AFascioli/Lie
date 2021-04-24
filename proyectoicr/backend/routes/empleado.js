const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Empleado = require("../models/empleado");
const Rol = require("../models/rol");
const Usuario = require("../models/usuario");
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
      res.status(200).json({
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
  let idEstadoPExamPendientes = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
  );
  let idEstadoExamPendientes = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  let idEstadoLibre = await ClaseEstado.obtenerIdEstado("Inscripcion", "Libre");

  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
            mongoose.Types.ObjectId(idEstadoLibre),
            mongoose.Types.ObjectId(idEstadoPromovido),
            mongoose.Types.ObjectId(idEstadoPExamPendientes),
            mongoose.Types.ObjectId(idEstadoExamPendientes),
          ],
        },
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
    // {
    //   $lookup: {
    //     from: "usuario",
    //     localField: "datosDocente.idUsuario",
    //     foreignField: "_id",
    //     as: "datosUsuario",
    //   },
    // },
    {
      $project: {
        "datosDocente.nombre": 1,
        "datosDocente.apellido": 1,
        "datosDocente._id": 1,
        "datosDocente.idUsuario": 1,
        "datosMateria.nombre": 1,
        "datosMateria._id": 1,
        datosMXC: 1,
      },
    },
  ])
    .then((resultado) => {
      let docentes = [];
      // for (let index = 0; index < resultado[0].datosDocente.length; index++) {
      //   let docente = {
      //     apellido: resultado[0].datosDocente[index].apellido,
      //     nombre: resultado[0].datosDocente[index].nombre,
      //     materia: resultado[0].datosMateria[index].nombre,
      //     idUsuario: resultado[0].datosUsuario[index]._id,
      //     seleccionado: false,
      //   };
      //   docentes.push(docente);
      // }

      for (const mxc of resultado[0].datosMXC) {
        let docente;
        let materia;
        for (let docenteFor of resultado[0].datosDocente) {
          if (docenteFor._id.toString() == mxc.idDocente.toString()) {
            docente = docenteFor;
          }
        }
        for (let materiaFor of resultado[0].datosMateria) {
          if (materiaFor._id.toString() == mxc.idMateria.toString()) {
            materia = materiaFor;
          }
        }

        if(!docente || !materia){
          throw "Error al obtener los datos de docentes y materias"
        }

        let docentepush = {
          apellido: docente.apellido,
          nombre: docente.nombre,
          materia: materia.nombre,
          idUsuario: docente.idUsuario,
          seleccionado: false,
        };
        docentes.push(docentepush);
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

router.get("/nombre", checkAuthMiddleware, (req, res, next) => {
  const nombre = req.query.nombre;
  const apellido = req.query.apellido;
  Empleado.find({
    nombre: { $regex: new RegExp(nombre, "i") },
    apellido: { $regex: new RegExp(apellido, "i") },
  })
    .then((empleados) => {
      res.status(200).json({
        empleados: empleados,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener el empleado por nombre",
        error: error.message,
      });
    });
});

router.get("/documento", checkAuthMiddleware, (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  Empleado.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
  })
    .then((empleados) => {
      res.status(200).json({
        empleados: empleados,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener el empleado por documento",
        error: error.message,
      });
    });
});

router.post("/modificar", checkAuthMiddleware, (req, res) => {
  Empleado.findByIdAndUpdate(req.body.empleado._id, {
    apellido: req.body.empleado.apellido,
    nombre: req.body.empleado.nombre,
    tipoDocumento: req.body.empleado.tipoDocumento,
    numeroDocumento: req.body.empleado.numeroDocumento,
    sexo: req.body.empleado.sexo,
    nacionalidad: req.body.empleado.nacionalidad,
    fechaNacimiento: req.body.empleado.fechaNacimiento,
    telefono: req.body.empleado.telefono,
    email: req.body.empleado.email,
    tipoEmpleado: req.body.empleado.tipoEmpleado,
  })
    .then(async () => {
      let rolNuevo = await Rol.findOne({
        tipo: req.body.empleado.tipoEmpleado,
      }).exec();
      Usuario.findByIdAndUpdate(req.body.empleado.idUsuario, {
        rol: rolNuevo._id,
      }).then((user) => {
        res.status(200).json({
          message: "Empleado modificado correctamente",
          exito: true,
        });
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer modificar el empleado",
        error: error.message,
      });
    });
});

module.exports = router;
