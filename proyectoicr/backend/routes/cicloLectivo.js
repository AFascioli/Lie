const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");
const cron = require("node-schedule");
const Inscripcion = require("../models/inscripcion");
const mongoose = require("mongoose");
const Estado = require("../models/estado");
const ClaseCXM = require("../classes/calificacionXMateria");
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

/* Se calculan los promedios de los trimestre y se asignan los estados de
acuerdo a si la materia esta aprobada o desaprobada y el promedio final en
caso de aprobada*/

let date = new Date();
let fechas;
CicloLectivo.findOne({ año: date.getFullYear() }).then(cicloLectivoActual => {
  fechas = {
    date: cicloLectivoActual.fechaFinTercerTrimestre.getDate(),
    month: cicloLectivoActual.fechaFinTercerTrimestre.getMonth(),
    year: cicloLectivoActual.fechaFinTercerTrimestre.getFullYear()
  };
});

cron.scheduleJob(
  //  {
  //Son fechas para testear metodo
  //   second: date.getSeconds() + 10,
  //   hour: date.getHours(),
  //   minute: date.getMinutes(),
  //   date: date.getDate(),
  //   month: date.getMonth(),
  //   year: date.getFullYear()
  // },
  fechas,
  () => {
    //Obtenemos todas las materias de las inscripciones activas y de este año
    //para cambiar el estado en el que se encuentran
    Inscripcion.aggregate([
      {
        $match: {
          activa: true,
          año: date.getFullYear()
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
          CXM: 1,
          materiasPendientes: 1
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
      let estadoAprobado;
      Estado.findOne({
        ambito: "CalificacionesXMateria",
        nombre: "Aprobada"
      }).then(estado => {
        estadoAprobado = estado;
      });
      let promedioTrim1 = 0;
      let promedioTrim2 = 0;
      let promedioTrim3 = 0;
      let promedioGral = 0;

      //El objeto materia tiene: CXT y CXM de una materia dada
      for (let materia of calificacionesDeInscripciones) {
        //Se busca la CXM que estamos recorriendo
        CalificacionesXMateria.findById({ _id: materia.CXM._id }).then(
          CXMEncontrada => {
            promedioTrim1 = 0;
            promedioTrim2 = 0;
            promedioTrim3 = 0;
            promedioGral = 0;

            //Calculamos el promedio del trimestre 3
            promedioTrim3 = ClaseCXM.obtenerPromedioDeTrimestre(
              materia.CXT[2].calificaciones
            );

            if (promedioTrim3 < 6) {
              Estado.findOne({
                ambito: "CalificacionesXMateria",
                nombre: "Desaprobada"
              }).then(async estado => {
                CXMEncontrada.estado = estado._id;
                CXMEncontrada.promedio = 0;
                await CXMEncontrada.save();
                // contadorMateriasDesaprobadas++;
              });
            } else {
              //Promedio trimestre 3 mayor a 6
              //Se calcula el promedio del primer trimestre
              promedioTrim1 = ClaseCXM.obtenerPromedioDeTrimestre(
                materia.CXT[0].calificaciones
              );

              //Se calcula el promedio del segundo trimestre
              promedioTrim2 = ClaseCXM.obtenerPromedioDeTrimestre(
                materia.CXT[1].calificaciones
              );

              promedioGral =
                (promedioTrim1 + promedioTrim2 + promedioTrim3) / 3;

              if (promedioGral >= 6) {
                CXMEncontrada.estado = estadoAprobado._id;
                CXMEncontrada.promedio = promedioGral;
                CXMEncontrada.save().then(() => {
                });
              } else {
                Estado.findOne({
                  ambito: "CalificacionesXMateria",
                  nombre: "Desaprobada"
                }).then(async estadoDesaprobado => {
                  CXMEncontrada.estado = estadoDesaprobado._id;
                  CXMEncontrada.promedio = 0;
                  await CXMEncontrada.save();
                  // contadorMateriasDesaprobadas++;
                });
              }
            }
          }
        );
      }
    });
    let contadorMateriasDesaprobadas=0;
    Inscripcion.aggregate([
      {
        $match: {
          activa: true
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
          materiasPendientes: 1,
          CXM: 1
        }
      }
    ]).then(materiasDeInscripcion => {
      //Se actualiza el estado de la inscripción según los estados de las diferentes CXM
      //y la cantidad de materias pendientes
      materiasDeInscripcion.forEach(inscripcion => {

        inscripcion.CXM.forEach(materia => {
          if(materia.promedio < 6){
            contadorMateriasDesaprobadas += 1;
          }
        })

        if(inscripcion.materiasPendientes.length !=0){
           contadorMateriasDesaprobadas += inscripcion.materiasPendientes.length+1;
        }

        if (
          contadorMateriasDesaprobadas > 3
        ) {
          Estado.findOne({
            ambito: "Inscripcion",
            nombre: "Examenes pendientes"
          }).then(estado => {
            Inscripcion.findByIdAndUpdate(inscripcion._id, {
              estado: estado._id
            }).exec();
          });
        } else {
          Estado.findOne({ ambito: "Inscripcion", nombre: "Promovido" }).then(
            estado => {
              Inscripcion.findByIdAndUpdate(inscripcion._id, {
                estado: estado._id
              }).exec();
            }
          );
        }
      });
    });
  }
);

//El metodo siguiente se fija la cantidad de materias desaprobadas del año lectivo y la
//cantidad de materias pendientes y de acuerdo a eso le cambia el estado a la inscripcion
let fechaActual = new Date();
let fechaFinExamenes;
CicloLectivo.findOne({ año: fechaActual.getFullYear() }).then(cicloLectivoActual => {
  fechaFinExamenes = {
    date: cicloLectivoActual.fechaFinExamenes.getDate(),
    month: cicloLectivoActual.fechaFinExamenes.getMonth(),
    year: cicloLectivoActual.fechaFinExamenes.getFullYear()
  };
});

cron.scheduleJob(
  //  {
  //Son fechas para testear metodo
  //   second: date.getSeconds() + 10,
  //   hour: date.getHours(),
  //   minute: date.getMinutes(),
  //   date: date.getDate(),
  //   month: date.getMonth(),
  //   year: date.getFullYear()
  // },
  fechaFinExamenes,
  () => {
    let contadorMateriasDesaprobadas=0;
    Inscripcion.aggregate([
      {
        $match: {
          activa: true
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
          materiasPendientes: 1,
          CXM: 1
        }
      }
    ]).then(materiasDeInscripcion => {
      //Se actualiza el estado de la inscripción según los estados de las diferentes CXM
      //y la cantidad de materias pendientes
      materiasDeInscripcion.forEach(inscripcion => {

        inscripcion.CXM.forEach(materia => {
          if(materia.promedio < 6){
            contadorMateriasDesaprobadas += 1;
          }
        })

        if(inscripcion.materiasPendientes.length !=0){
           contadorMateriasDesaprobadas += inscripcion.materiasPendientes.length+1;
        }

        if (
          contadorMateriasDesaprobadas > 3
        ) {
          Estado.findOne({
            ambito: "Inscripcion",
            nombre: "Libre"
          }).then(estado => {
            Inscripcion.findByIdAndUpdate(inscripcion._id, {
              estado: estado._id
            }).exec();
          });
        } else {
          Estado.findOne({ ambito: "Inscripcion", nombre: "Promovido" }).then(
            estado => {
              Inscripcion.findByIdAndUpdate(inscripcion._id, {
                estado: estado._id
              }).exec();
            }
          );
        }
      });
    });
  });

module.exports = router;
