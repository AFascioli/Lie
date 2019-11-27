const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");
const cron = require("node-schedule");
const Inscripcion = require("../models/inscripcion");
const mongoose = require("mongoose");
const Estado = require("../models/estado");
const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const CalificacionesXMateria = require("../models/calificacionesXMateria");

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

let date = new Date();
console.log(date);
console.log("Hora: " + date.getHours());
console.log("Minuto: " + date.getMinutes());
console.log("Dia: " + date.getDate());
console.log("Mes: " + date.getMonth());
console.log("Año: " + date.getFullYear());

//let date = new Date();
//CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then( cicloLectivoActual =>{})

cron.scheduleJob(
  {
    // date: cicloLectivoActual.fechaFinTercerTrimestre.getDate(),
    // month: cicloLectivoActual.fechaFinTercerTrimestre.getMonth(),
    // year: cicloLectivoActual.fechaFinTercerTrimestre.getFullYear()
    second: date.getSeconds() + 10,
    hour: date.getHours(),
    minute: date.getMinutes(),
    date: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear()
  },
  () => {
    console.log("Se ejecuto");
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
        console.log("materia" + materia._id);
        promedioTrim1 = 0;
        promedioTrim2 = 0;
        promedioTrim3 = 0;
        promedioGral = 0;
        contador = 0;
        materia.CXT[2].calificaciones.forEach(calificacion => {
          // console.log("calificacion " + calificacion);
          if (calificacion != 0) {
            contador = contador + 1;
            promedioTrim3 = promedioTrim3 + calificacion;
          }
        });
        // console.log("contador " + contador);
        // console.log("sumaTotal " + promedioTrim3);
        if (contador != 0) {
          promedioTrim3 = promedioTrim3 / contador;
        }
        console.log("promedio" + promedioTrim3);
        if (promedioTrim3 < 6) {
          Estado.findOne({
            ambito: "CalificacionesXMateria",
            nombre: "Desaprobada"
          }).then(estado => {
            CalificacionesXMateria.findById({ _id: materia.CXM._id }).then(
              async CXMEncontrada => {
                CXMEncontrada.estado = estado._id;
                CXMEncontrada.promedio = 0;
                await CXMEncontrada.save().then(() => {});
              }
            );
          });
        } else {
          contador = 0;
          materia.CXT[0].calificaciones.forEach(calificacion => {
            if (calificacion != 0) {
              contador = contador + 1;
              promedioTrim1 = promedioTrim1 + calificacion;
            }
          });
          if (contador != 0) {
            promedioTrim1 = promedioTrim1 / contador;
          }
          contador = 0;
          materia.CXT[1].calificaciones.forEach(calificacion => {
            if (calificacion != 0) {
              contador = contador + 1;
              promedioTrim2 = promedioTrim2 + calificacion;
            }
          });
          if (contador != 0) {
            promedioTrim2 = promedioTrim2 / contador;
          }
          promedioGral = (promedioTrim1 + promedioTrim2 + promedioTrim3) / 3;
          console.log("calculo promgral " + promedioGral);
          console.log("t1 " + promedioTrim1);
          console.log("t2 " + promedioTrim2);
          console.log("t3 " + promedioTrim3);
          if (promedioGral >= 6) {
            Estado.findOne({
              ambito: "CalificacionesXMateria",
              nombre: "Aprobada"
            }).then(async estadoAprobado => {
              CalificacionesXMateria.findById({ _id: materia.CXM._id }).then(
                async CXMEncontrada => {
                  console.log("t1 " + promedioTrim1);
                  console.log("t2 " + promedioTrim2);
                  console.log("t3 " + promedioTrim3);
                  CXMEncontrada.estado = estadoAprobado._id;
                  CXMEncontrada.promedio =
                    (await (promedioTrim1 + promedioTrim2 + promedioTrim3)) / 3;
                  await CXMEncontrada.save().then(() => {
                    console.log(CXMEncontrada);
                    console.log(promedioGral);
                  });
                }
              );
            });
          } else {
            Estado.findOne({
              ambito: "CalificacionesXMateria",
              nombre: "Desaprobada"
            }).then(estadoDesaprobado => {
              CalificacionesXMateria.findById({ _id: materia.CXM._id }).then(
                async CXMEncontrada => {
                  CXMEncontrada.estado = estadoDesaprobado._id;
                  CXMEncontrada.promedio = 0;
                  await CXMEncontrada.save().then(() => {});
                }
              );
            });
          }
        }
      });
    });
  }
);

module.exports = router;
