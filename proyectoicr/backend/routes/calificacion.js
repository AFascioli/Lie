const express = require("express");
const Inscripcion = require("../models/inscripcion");
const router = express.Router();
const mongoose = require("mongoose");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseEstado = require("../classes/estado");
const CalificacionesXMateria= require("../models/calificacionesXMateria");

//Dado un id de estudiante obtiene todas las materias desaprobadas del año actual
//Retorna vector con id materia y nombre materia
//@param: idEstudiante
router.get("/materiasDesaprobadas", (req, res) => {
  let fechaActual = new Date();

  Inscripcion.findOne({
    idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
    año: fechaActual.getFullYear(),
    activa: true
  }).then(async (inscripcion) => {
    let idEstado = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Desaprobada"
    );

    let idsCXMDesaprobadas = await ClaseCXM.obtenerMateriasDesaprobadasv2(
      inscripcion.materiasPendientes,
      inscripcion.calificacionesXMateria,
      idEstado
    );

    if (idsCXMDesaprobadas.length != 0) {
      let materiasDesaprobadas = await ClaseCXM.obtenerNombresMaterias(
        idsCXMDesaprobadas
      );

      return res.status(200).json({
        message: "Materias desaprobadas obtenidas correctamente",
        exito: true,
        materiasDesaprobadas: materiasDesaprobadas,
      });
    } else {
      return res.status(200).json({
        message: "El alumno seleccionado no tiene materias desaprobadas",
        exito: true,
        materiasDesaprobadas: [],
      });
    }
  });
});

//Dado una id de estudiante y un trimestre obtiene todas las materias con sus respectivas calificaciones
router.get("/materia/calificaciones", (req, res) => {
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        activa: true,
      },
    },
    {
      $lookup: {
        from: "calificacionesXMateria",
        localField: "calificacionesXMateria",
        foreignField: "_id",
        as: "cXM",
      },
    },
    {
      $unwind: {
        path: "$cXM",
      },
    },
    {
      $lookup: {
        from: "calificacionesXTrimestre",
        localField: "cXM.calificacionesXTrimestre",
        foreignField: "_id",
        as: "cXT",
      },
    },
    {
      $unwind: {
        path: "$cXT",
      },
    },
    {
      $match: {
        "cXT.trimestre": parseInt(req.query.trimestre, 10),
      },
    },
    {
      $lookup: {
        from: "materia",
        localField: "cXM.idMateria",
        foreignField: "_id",
        as: "materia",
      },
    },
    {
      $project: {
        "cXT.calificaciones": 1,
        "materia.nombre": 1,
      },
    },
  ])
    .then((resultado) => {
      let vectorRespuesta = [];
      resultado.forEach((objEnResultado) => {
        vectorRespuesta.push({
          materia: objEnResultado.materia[0].nombre,
          calificaciones: objEnResultado.cXT.calificaciones,
        });
      });
      res.status(200).json({
        message: "Operación exitosa",
        exito: true,
        vectorCalXMat: vectorRespuesta,
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Registra la nota del examen como promedio de la cxm y cambia su estado a "AprobadaConExamen"
//@params: idEstudiante
//@params: idMateria
//@params: Calificacion
router.post("/examen", async (req, res) => {
  let estadoAprobada = await ClaseEstado.obtenerIdEstado(
    "CalificacionesXMateria",
    "AprobadaConExamen"
  );

  let obtenerIdCXM = (idEstudiante, idMateria) => {
    return new Promise((resolve, reject) => {
      Inscripcion.aggregate([
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(idEstudiante),
            activa: true,
          },
        },
        {
          $lookup: {
            from: "calificacionesXMateria",
            localField: "calificacionesXMateria",
            foreignField: "_id",
            as: "CXM",
          },
        },
        {
          $unwind: {
            path: "$CXM",
          },
        },
        {
          $match: {
            "CXM.idMateria": mongoose.Types.ObjectId(idMateria),
          },
        },
        {
          $project: {
            CXM: 1,
          },
        },
      ])
        .then((cxmEncontrada) => {
          if (cxmEncontrada.length!=0) {
            resolve(cxmEncontrada[0].CXM._id);
          } else {
            resolve(null);
          }
        });
    });
  };

  let obtenerIdCXMPendiente = (idEstudiante, idMateria) => {
    return new Promise((resolve, reject) => {
      Inscripcion.aggregate([
        {
          $match: {
            idEstudiante: mongoose.Types.ObjectId(idEstudiante),
            activa: true,
          },
        },
        {
          $lookup: {
            from: "calificacionesXMateria",
            localField: "materiasPendientes",
            foreignField: "_id",
            as: "datosMateriasPendientes",
          },
        },
        {
          $unwind: {
            path: "$datosMateriasPendientes",
          },
        },
        {
          $match: {
            "datosMateriasPendientes.idMateria": mongoose.Types.ObjectId(
              idMateria
            ),
          },
        },
        {
          $project: {
            datosMateriasPendientes: 1,
          },
        },
      ]).then((cxmEncontrada) => {
          if (cxmEncontrada.length!=0) {
            resolve(cxmEncontrada[0].datosMateriasPendientes._id);
          } else {
            resolve(null);
          }
        });
    });
  };

  let actualizarCXM = (estadoNuevo, promedioNuevo) => {
    return new Promise((resolve, reject) => {
      CalificacionesXMateria.findOneAndUpdate(
        { _id: idCXMAEditar },
        { estado: estadoNuevo, promedio: promedioNuevo }
      )
        .then(() => {
          resolve();
        });
    });
  };

  //Se busca si la materia rendida es una materia que no pendiente
  let idCXM = await obtenerIdCXM(req.body.idEstudiante, req.body.idMateria);
  let idCXMAEditar = "";

  if (idCXM != null) {
    idCXMAEditar = idCXM;
  } else {
    //Si la materia rendida es una materia pendiente se obtiene su id
    let idCXMPendiente = await obtenerIdCXMPendiente(req.body.idEstudiante, req.body.idMateria);
    idCXMAEditar = idCXMPendiente;
    //Se elimina la cxm del vector de materias pendientes
    Inscripcion.findOneAndUpdate(
      { idEstudiante: req.body.idEstudiante, activa: true },
      { $pull: { materiasPendientes: idCXMAEditar } }
    ).exec();
  }

  //Actualizamos la CXM para que tenga estado aprobada y le ponemos la calificacion correspondiente
  await actualizarCXM(estadoAprobada, req.body.calificacion);

  res.status(200).json({
    message: "Se asignó la calificacion del examen exitosamente",
    exito: true,
  });
});


module.exports = router;
