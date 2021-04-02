const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ClaseCXM = require("../classes/calificacionXMateria");
const checkAuthMiddleware = require("../middleware/check-auth");
const ClaseEstado = require("../classes/estado");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const Inscripcion = require("../models/inscripcion");

//Dado un id de estudiante obtiene todas las materias desaprobadas del año actual
//Retorna vector con id materia y nombre materia
//@param: idEstudiante
router.get("/materiasDesaprobadas", checkAuthMiddleware, async (req, res) => {
  try {
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido con examenes pendientes"
    );
    let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Examenes pendientes"
    );
    let idLibre = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Libre"
    );

    Inscripcion.findOne({
      idEstudiante: req.query.idEstudiante,
      estado: {
        $in: [
          mongoose.Types.ObjectId(idEstadoActiva),
          mongoose.Types.ObjectId(idEstadoSuspendido),
          mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
          mongoose.Types.ObjectId(idEstadoExPendiente),
          mongoose.Types.ObjectId(idLibre),
        ],
      },
    }).then(async (inscripcion) => {
      if (!inscripcion) {
        return res.status(200).json({
          message: "El alumno seleccionado no tiene materias desaprobadas",
          exito: true,
          materiasDesaprobadas: [],
        });
      }

      let idPendiente= await ClaseEstado.obtenerIdEstado(
        "CalificacionesXMateria",
        "Pendiente examen"
        );
      let idDesaprobada= await ClaseEstado.obtenerIdEstado(
        "CalificacionesXMateria",
        "Desaprobada"
        );
      let idEstado =[idPendiente,idDesaprobada]
        
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
  } catch (error) {
    res.status(500).json({
      message:
        "Ocurrió un error al querer obtener las materias desaprobadas de un estudiante",
      error: error.message,
    });
  }
});

//Dado una id de estudiante y un trimestre obtiene todas las materias con sus respectivas calificaciones
router.get("/materia/calificaciones", checkAuthMiddleware, async (req, res) => {
  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );
  let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Suspendido"
  );
  let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido con examenes pendientes"
  );
  let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Examenes pendientes"
  );
  let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Promovido"
  );
  let idEstadoLibre = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Libre"
  );  
  Inscripcion.aggregate([
    {
      $match: {
        idEstudiante: mongoose.Types.ObjectId(req.query.idEstudiante),
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
            mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
            mongoose.Types.ObjectId(idEstadoExPendiente),
            mongoose.Types.ObjectId(idEstadoPromovido),
            mongoose.Types.ObjectId(idEstadoLibre),
          ],
        },
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
        "cXM":1
      },
    },
  ])
    .then(async(resultado) => {
      let idAprobConEx = await ClaseEstado.obtenerIdEstado("CalificacionesXMateria","AprobadaConExamen")
      let vectorRespuesta = [];
      resultado.forEach((objEnResultado) => {
        let notaExamen=0;
        if(objEnResultado.cXM.estado.toString().localeCompare(idAprobConEx.toString())==0){
          notaExamen=parseFloat(objEnResultado.cXM.promedio);
        }
        vectorRespuesta.push({
          materia: objEnResultado.materia[0].nombre,
          calificaciones: objEnResultado.cXT.calificaciones,
          notaExamen:notaExamen
        });
      });
      res.status(200).json({
        message: "Operación exitosa",
        exito: true,
        vectorCalXMat: vectorRespuesta,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener las calificaciones para una materia y un trimestre",
        error: error.message,
      });
    });
});

//Registra la nota del examen como promedio de la cxm y cambia su estado a "AprobadaConExamen"
//@params: idEstudiante
//@params: idMateria
//@params: Calificacion
//@params: idCurso
router.post("/examen", checkAuthMiddleware, async (req, res) => {
  try {
    let estadoAprobada = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "AprobadaConExamen"
    );

    let obtenerIdCXM = (idEstudiante, idMateria) => {
      return new Promise(async (resolve, reject) => {
        let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
          "Inscripcion",
          "Activa"
        );
        let idEstadoPromovidoConExPend = await ClaseEstado.obtenerIdEstado(
          "Inscripcion",
          "Promovido con examenes pendientes"
        );
        let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
          "Inscripcion",
          "Examenes pendientes"
        );
        Inscripcion.aggregate([
          {
            $match: {
              idEstudiante: mongoose.Types.ObjectId(idEstudiante),
              idCurso: mongoose.Types.ObjectId(req.body.idCurso),
              estado: {
                $in: [
                  mongoose.Types.ObjectId(idEstadoActiva),
                  mongoose.Types.ObjectId(idEstadoPromovidoConExPend),
                  mongoose.Types.ObjectId(idEstadoExPendiente),
                ],
              },
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
        ]).then((cxmEncontrada) => {
          if (cxmEncontrada.length != 0) {
            resolve(cxmEncontrada[0].CXM._id);
          } else {
            resolve(null);
          }
        });
      });
    };

    let obtenerIdCXMPendiente = (idEstudiante, idMateria) => {
      return new Promise(async (resolve, reject) => {
        let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
          "Inscripcion",
          "Activa"
        );
        let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
          "Inscripcion",
          "Examenes pendientes"
        );
        Inscripcion.aggregate([
          {
            $match: {
              idEstudiante: mongoose.Types.ObjectId(idEstudiante),
              estado: {
                $in: [
                  mongoose.Types.ObjectId(idEstadoActiva),
                  mongoose.Types.ObjectId(idEstadoExPendiente),
                ],
              },
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
          if (cxmEncontrada.length != 0) {
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
        ).then(() => {
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
      let idCXMPendiente = await obtenerIdCXMPendiente(
        req.body.idEstudiante,
        req.body.idMateria
      );
      let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Activa"
      );
      let idEstadoExPendiente = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Examenes pendientes"
      );
      idCXMAEditar = idCXMPendiente;
      //Se elimina la cxm del vector de materias pendientes
      Inscripcion.findOneAndUpdate(
        {
          idEstudiante: req.body.idEstudiante,
          estado: {
            $in: [
              mongoose.Types.ObjectId(idEstadoActiva),
              mongoose.Types.ObjectId(idEstadoExPendiente),
            ],
          },
        },
        { $pull: { materiasPendientes: idCXMAEditar } }
      ).exec();
    }

    //Actualizamos la CXM para que tenga estado aprobada y le ponemos la calificacion correspondiente
    await actualizarCXM(estadoAprobada, req.body.calificacion);

    res.status(200).json({
      message: "Se asignó la calificación del examen exitosamente",
      exito: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ocurrió un error al querer registrar la nota del examen",
      error: error.message,
    });
  }
});

module.exports = router;
