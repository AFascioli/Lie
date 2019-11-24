const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");
const cron = require("node-cron");
//var  CronJob = require('cron').CronJob

router.get("/", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then(
    cicloLectivo => {
      if (cicloLectivo) {
        res.status(200).json({
          cicloLectivo: cicloLectivo,
          message:
            "Se han obtenido las fechas correspondientes a este año exitosamente",
          exito: true
        });
      } else {
        res.status(200).json({
          message: "No se han obtenido las fechas correspondientes a este año",
          exito: false
        });
      }
    }
  );
});

function procesosAutomaticos() {
  console.log('entro');
  CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then(
    cicloLectivoActual => {

    //   var rule = new schedule.RecurrenceRule();
    //  //borrar estos dos despues y el idEstudiante abajo
    //  rule.minute=40;
    //   rule.hour= 13;
    //   rule.date = 24;
    //   //cicloLectivoActual.fechaFinTercerTrimestre.getDate();
    //   rule.month = 11;
    //   //cicloLectivoActual.fechaFinTercerTrimestre.getMonth();
    //   rule.year = 2019;
    //   //cicloLectivoActual.fechaFinTercerTrimestre.getFullYear();
    cron.schedule('10 19 24 11 *', function() {
        Inscripcion.aggregate([
          {
            $match: {
              activa: true,
              idEstudiante: mongoose.Types.ObjectId("5d0ee07c489bdd0830bd1d0d")
            }
          },
          {
            $lookup: {
              from: "calificacionesXMateria",
              localField: "calificacionesXMateria",
              foreignField: "_id",
              as: "CXM"
            }
          },
          {
            $project: {
              CXM: 1
            }
          },
          {
            $unwind: {
              path: "$CXM"
            }
          },
          {
            $lookup: {
              from: "calificacionesXTrimestre",
              localField: "CXM.calificacionesXTrimestre",
              foreignField: "_id",
              as: "CXT"
            }
          }
        ]).then(calificacionesDeInscripciones => {
          let promedioTrim1 = 0;
          let promedioTrim2 = 0;
          let promedioTrim3 = 0;
          let promedioGral = 0;
          let contador = 0;

          calificacionesDeInscripciones.forEach(materia => {
            console.log("ejecutando");
            materia.CXT[2].calificaciones.forEach(calificacion => {
              for (let i = 0; i < calificacion.length - 1; i++) {
                if (calificacion[i] != null) {
                  contador = contador + 1;
                  promedioTrim3 = promedioTrim3 + calificacion[i];
                }
              }
              if (contador != 0) {
                promedioTrim3 = promedioTrim3 / contador;
              }
            });

            if (promedioTrim3 < 6) {
              Estado.findOne({
                ambito: "calificacionesXMateria",
                nombre: "Desaprobada"
              }).then(estado => {
                materia.CXM.estado = estado._id;
                materia.CXM.save();
              });
            } else {
              contador = 0;
              materia.CXT[0].calificaciones.forEach(calificacion => {
                for (let i = 0; i < calificacion.length - 1; i++) {
                  if (calificacion[i] != null) {
                    contador = contador + 1;
                    promedioTrim1 = promedioTrim1 + calificacion[i];
                  }
                }
                if (contador != 0) {
                  promedioTrim1 = promedioTrim1 / contador;
                }
              });
              contador = 0;
              materia.CXT[1].calificaciones.forEach(calificacion => {
                for (let i = 0; i < calificacion.length - 1; i++) {
                  if (calificacion[i] != null) {
                    contador = contador + 1;
                    promedioTrim2 = promedioTrim2 + calificacion[i];
                  }
                }
                if (contador != 0) {
                  promedioTrim2 = promedioTrim2 / contador;
                }
              });
              promedioGral =
                (promedioTrim1 + promedioTrim2 + promedioTrim3) / 3;
              if (promedioGral >= 6) {
                Estado.findOne({
                  ambito: "calificacionesXMateria",
                  nombre: "Aprobada"
                }).then(estadoAprobado => {
                  materia.CXM.estado = estadoAprobado._id;
                  materia.CXM.save();
                });
              } else {
                Estado.findOne({
                  ambito: "calificacionesXMateria",
                  nombre: "Desaprobada"
                }).then(estadoDesaprobado => {
                  materia.CXM.estado = estadoDesaprobado._id;
                  materia.CXM.save();
                });
              }
              promedioTrim1 = 0;
              promedioTrim2 = 0;
              promedioTrim3 = 0;
              promedioGral = 0;
              contador = 0;
            }
          });
        });
      });
    }
  );
}

module.exports = router;
