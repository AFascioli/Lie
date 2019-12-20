const express = require("express");
const Estudiante = require("../models/estudiante");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const Suscripcion = require("../classes/suscripcion");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const ClaseEstudiante = require("../classes/estudiante");

//Registra un nuevo estudiante y pone su estado a registrado
router.post("", checkAuthMiddleware, (req, res, next) => {
  Estudiante.findOne({
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento
  }).then(estudiante => {
    if (estudiante) {
      res.status(200).json({
        message: "El estudiante ya se encuentra registrado",
        exito: false
      });
    } else {
      Estado.findOne({
        ambito: "Estudiante",
        nombre: "Registrado"
      }).then(estado => {
        ClaseEstudiante.CrearEstudiante(
          req.body.apellido,
          req.body.nombre,
          req.body.tipoDocumento,
          req.body.numeroDocumento,
          req.body.cuil,
          req.body.sexo,
          req.body.calle,
          req.body.numeroCalle,
          req.body.piso,
          req.body.departamento,
          req.body.provincia,
          req.body.localidad,
          req.body.codigoPostal,
          req.body.nacionalidad,
          req.body.fechaNacimiento,
          req.body.estadoCivil,
          req.body.telefonoFijo,
          [],
          true,
          estado._id
        ).then(estudiante => {
          estudiante
            .save()
            .then(() => {
              res.status(201).json({
                message: "Estudiante registrado correctamente",
                exito: true
              });
            })
            .catch(() =>
              res.status(200).json({
                message:
                  "Ocurrió un error al meter en la base de datos a un estudiante",
                exito: false
              })
            );
        });
      });
    }
  });
});

//Obtiene los adultos responsable de un estudiante
router.get("/adultosResponsables", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true
      }
    },
    {
      $lookup: {
        from: "adultoResponsable",
        localField: "adultoResponsable",
        foreignField: "_id",
        as: "datosAR"
      }
    },
    {
      $project: {
        "datosAR._id": 1,
        "datosAR.apellido": 1,
        "datosAR.nombre": 1,
        "datosAR.telefono": 1,
        "datosAR.email": 1,
        "datosAR.tipoDocumento": 1,
        "datosAR.numeroDocumento": 1
      }
    }
  ]).then(datosAdResp => {
    if (!datosAdResp) {
      return res.status(200).json({
        message: "El estudiante no tiene adultos responsables a su cargo",
        exito: false
      });
    }
    let AR = [];
    datosAdResp[0].datosAR.forEach(AdResp => {
      AR.push(AdResp);
    });
    return res.status(200).json({
      message: "Se obtuvieron los adultos responsables exitosamente",
      exito: true,
      tutores: AR
    });
  });
});

//Borrado logico de un estudiante
router.delete("/borrar", checkAuthMiddleware, (req, res, next) => {
  Estado.findOne({
    ambito: "Estudiante",
    nombre: "De baja"
  }).then(estado => {
    Estudiante.findOneAndUpdate(
      { _id: req.query._id },
      { activo: false, estado: estado._id }
    ).then(() => {
      Inscripcion.findOne({
        idEstudiante: req.query._id,
        activa: true
      }).then(inscripcion => {
        if (inscripcion) {
          inscripcion.activa = false;
          inscripcion.save();
        }
        res.status(202).json({
          message: "Estudiante exitosamente borrado"
        });
      });
    });
  });
});

//Dada una id de estudiante, se fija si esta inscripto en un curso
router.get("/curso", checkAuthMiddleware, (req, res) => {
  Estudiante.findOne({ _id: req.query.idEstudiante, activo: true }).then(
    estudiante => {
      Estado.findById(estudiante.estado).then(estado => {
        console.log(estado);
        if (estado.nombre == "Inscripto") {
          res.status(200).json({
            message:
              "El estudiante seleccionado ya se encuentra inscripto en un curso",
            exito: true
          });
        } else {
          res.status(200).json({
            message: "El estudiante seleccionado no esta inscripto en un curso",
            exito: false
          });
        }
      });
    }
  );
});

//Obtiene un estudiante dado un numero y tipo de documento
router.get("/documento", checkAuthMiddleware, (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  Estudiante.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
    activo: true
  }).then(documents => {
    res.status(200).json({
      estudiantes: documents
    });
  });
});

//Recibe por parametros un vector de los estudiantes con los respectivos documentos entregados
router.post("/documentos", checkAuthMiddleware, (req, res) => {
  try {
    req.body.forEach(estudiante => {
      Inscripcion.findOneAndUpdate(
        { idEstudiante: estudiante.idEstudiante, activa: true },
        { $set: { documentosEntregados: estudiante.documentosEntregados } }
      ).exec();
    });
    res
      .status(201)
      .json({ message: "Documentos guardados correctamente", exito: true });
  } catch {
    res.status(201).json({ message: e, exito: false });
  }
});

//Modifica un estudiante
router.patch("/modificar", checkAuthMiddleware, (req, res, next) => {
  Estudiante.findByIdAndUpdate(req.body._id, {
    apellido: req.body.apellido,
    nombre: req.body.nombre,
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
    cuil: req.body.cuil,
    sexo: req.body.sexo,
    calle: req.body.calle,
    numeroCalle: req.body.numeroCalle,
    piso: req.body.piso,
    departamento: req.body.departamento,
    provincia: req.body.provincia,
    localidad: req.body.localidad,
    codigoPostal: req.body.codigoPostal,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    estadoCivil: req.body.estadoCivil,
    telefonoFijo: req.body.telefonoFijo
  })
    .then(() => {
      res.status(200).json({
        message: "Estudiante modificado exitosamente",
        exito: true
      });
    })
    .catch(() => {
      res.status(200).json({
        message: "Ocurrió un problema al intentar modificar el estudiante",
        exito: false
      });
    });
});

//Busqueda de un estudisante por nombre y apellido ignorando mayusculas
router.get("/nombreyapellido", checkAuthMiddleware, (req, res, next) => {
  const nombre = req.query.nombre;
  const apellido = req.query.apellido;
  Estudiante.find({
    nombre: { $regex: new RegExp(nombre, "i") },
    apellido: { $regex: new RegExp(apellido, "i") },
    activo: true
  }).then(documents => {
    res.status(200).json({
      estudiantes: documents
    });
  });
});

//Prueba notif #resolve #borrar
router.get("/notificacion", (req, res) => {
  Suscripcion.notificar(
    "5d7bfd1b93119f33f80819a1",
    "Titulo",
    "Notificación de prueba."
  );
  res.status(200).json({ message: "Prueba de notificación" });
});

//Obtiene los tutores de un estudiante
router.get("/tutores", (req, res) => {
  Estudiante.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.query.idEstudiante),
        activo: true
      }
    },
    {
      $lookup: {
        from: "adultoResponsable",
        localField: "adultoResponsable",
        foreignField: "_id",
        as: "datosAR"
      }
    },
    {
      $unwind: {
        path: "$datosAR"
      }
    },
    {
      $match: {
        "datosAR.tutor": true
      }
    },
    {
      $project: {
        "datosAR._id": 1,
        "datosAR.apellido": 1,
        "datosAR.nombre": 1,
        "datosAR.telefono": 1
      }
    }
  ]).then(datosTutores => {
    if (!datosTutores) {
      return res.status(200).json({
        message: "El estudiante no tiene tutores",
        exito: false
      });
    }
    let tutores = [];
    datosTutores.forEach(tutor => {
      tutores.push(tutor.datosAR);
    });
    return res.status(200).json({
      message: "Se obtuvieron los tutores exitosamente",
      exito: true,
      tutores: tutores
    });
  });
});

module.exports = router;
