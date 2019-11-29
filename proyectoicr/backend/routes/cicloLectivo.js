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

/* Se calculan los promedios de los trimestre y se asignan los estados de
acuerdo a si la materia esta aprobada o desaprobada y el promedio final en
caso de aprobada*/

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
      let estadoAprobado;
       Estado.findOne({
        ambito: "CalificacionesXMateria",
        nombre: "Aprobada"
      }).then(estado =>{
        estadoAprobado = estado;} );
      let promedioTrim1 = 0;
      let promedioTrim2 = 0;
      let promedioTrim3 = 0;
      let promedioGral = 0;
      let contador = 0;
      //El objeto materia tiene: CXT y CXM de una materia dada

      async function forEachAsincrono(array, callback){
        array.forEach(async (materia, index) => {
          await callback(materia, index, array);
        });
      }

      for(let materia of calificacionesDeInscripciones) {
        //Se busca la CXM que estamos recorriendo
        CalificacionesXMateria.findById({ _id: materia.CXM._id }).then(
          CXMEncontrada => {
            promedioTrim1 = 0;
            promedioTrim2 = 0;
            promedioTrim3 = 0;
            promedioGral = 0;
            contador = 0; //Cuenta la cantidad de notas que tiene la materia en ese trimestre

            //Calculamos el promedio del trimestre 3
            materia.CXT[2].calificaciones.forEach(calificacion => {
              if (calificacion != 0) {
                contador = contador + 1;
                promedioTrim3 = promedioTrim3 + calificacion;
              }
            });
            if (contador != 0) {
              promedioTrim3 = promedioTrim3 / contador;
            }

            if (promedioTrim3 < 6) {
              Estado.findOne({
                ambito: "CalificacionesXMateria",
                nombre: "Desaprobada"
              }).then(async estado => {
                CXMEncontrada.estado = estado._id;
                CXMEncontrada.promedio = 0;
                await CXMEncontrada.save();
              });
            } else {
              //Promedio trimestre 3 mayor a 6
              contador = 0;
              //Se calcula el promedio del primer trimestre
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
              //Se calcula el promedio del segundo trimestre
              materia.CXT[1].calificaciones.forEach(calificacion => {
                if (calificacion != 0) {
                  contador = contador + 1;
                  promedioTrim2 = promedioTrim2 + calificacion;
                }
              });
              if (contador != 0) {
                promedioTrim2 = promedioTrim2 / contador;
              }
              promedioGral =
                (promedioTrim1 + promedioTrim2 + promedioTrim3) / 3;
              console.log("calculo promgral " + promedioGral);
              console.log("t1 " + promedioTrim1);
              console.log("t2 " + promedioTrim2);
              console.log("t3 " + promedioTrim3);
              if (promedioGral >= 6) {
                console.log("entroIF" +promedioGral);

                 saveAprobada(CXMEncontrada,estadoAprobado, promedioGral);

              } else {
                Estado.findOne({
                  ambito: "CalificacionesXMateria",
                  nombre: "Desaprobada"
                }).then(async estadoDesaprobado => {
                  CXMEncontrada.estado = estadoDesaprobado._id;
                  CXMEncontrada.promedio = 0;
                  await CXMEncontrada.save();
                });
              }
            }
          }
        );
      };

      // calificacionesDeInscripciones.forEach(materia => {
      //   //Se busca la CXM que estamos recorriendo
      //   CalificacionesXMateria.findById({ _id: materia.CXM._id }).then(
      //     CXMEncontrada => {
      //       promedioTrim1 = 0;
      //       promedioTrim2 = 0;
      //       promedioTrim3 = 0;
      //       promedioGral = 0;
      //       contador = 0; //Cuenta la cantidad de notas que tiene la materia en ese trimestre

      //       //Calculamos el promedio del trimestre 3
      //       materia.CXT[2].calificaciones.forEach(calificacion => {
      //         if (calificacion != 0) {
      //           contador = contador + 1;
      //           promedioTrim3 = promedioTrim3 + calificacion;
      //         }
      //       });
      //       if (contador != 0) {
      //         promedioTrim3 = promedioTrim3 / contador;
      //       }

      //       if (promedioTrim3 < 6) {
      //         Estado.findOne({
      //           ambito: "CalificacionesXMateria",
      //           nombre: "Desaprobada"
      //         }).then(estado => {
      //           CXMEncontrada.estado = estado._id;
      //           CXMEncontrada.promedio = 0;
      //           CXMEncontrada.save();
      //         });
      //       } else {
      //         //Promedio trimestre 3 mayor a 6
      //         contador = 0;
      //         //Se calcula el promedio del primer trimestre
      //         materia.CXT[0].calificaciones.forEach(calificacion => {
      //           if (calificacion != 0) {
      //             contador = contador + 1;
      //             promedioTrim1 = promedioTrim1 + calificacion;
      //           }
      //         });
      //         if (contador != 0) {
      //           promedioTrim1 = promedioTrim1 / contador;
      //         }
      //         contador = 0;
      //         //Se calcula el promedio del segundo trimestre
      //         materia.CXT[1].calificaciones.forEach(calificacion => {
      //           if (calificacion != 0) {
      //             contador = contador + 1;
      //             promedioTrim2 = promedioTrim2 + calificacion;
      //           }
      //         });
      //         if (contador != 0) {
      //           promedioTrim2 = promedioTrim2 / contador;
      //         }
      //         promedioGral =
      //           (promedioTrim1 + promedioTrim2 + promedioTrim3) / 3;
      //         console.log("calculo promgral " + promedioGral);
      //         console.log("t1 " + promedioTrim1);
      //         console.log("t2 " + promedioTrim2);
      //         console.log("t3 " + promedioTrim3);
      //         if (promedioGral >= 6) {
      //           console.log("entroIF");
      //           // try{
      //           //   Estado.findOne({
      //           //     ambito: "CalificacionesXMateria",
      //           //     nombre: "Aprobada"
      //           //   }).then(async estadoAprobado => {
      //           //     CXMEncontrada.estado = estadoAprobado._id;
      //           //     CXMEncontrada.promedio = promedioGral;
      //           //     var rtdo= await CXMEncontrada.save();
      //           //     console.log(rtdo);
      //           //   });
      //           // }catch(err) {
      //           //   console.log(err);
      //           // }

      //           var promesa = async () => {
      //             var rtdo = await Estado.findOne({
      //               ambito: "CalificacionesXMateria",
      //               nombre: "Aprobada"
      //             });
      //             return rtdo;
      //           };
      //           var promesa2 = async (estado,promedioGral) => {
      //             CXMEncontrada.estado = estado._id;
      //             CXMEncontrada.promedio = promedioGral;
      //             return await CXMEncontrada.save();
      //           };
      //           promesa().then(estado => {
      //             console.log(promedioGral);
      //             promesa2(estado, promedioGral).then(CXM=>{
      //               console.log(CXM);
      //             });
      //           });

      //           // Estado.findOne({
      //           //   ambito: "CalificacionesXMateria",
      //           //   nombre: "Aprobada"
      //           // }).then(async estadoAprobado => {
      //           //   CXMEncontrada.estado = estadoAprobado._id;
      //           //   CXMEncontrada.promedio = promedioGral;
      //           //   await CXMEncontrada.save().then(() => {
      //           //     console.log(CXMEncontrada);
      //           //   });
      //           // });
      //         } else {
      //           Estado.findOne({
      //             ambito: "CalificacionesXMateria",
      //             nombre: "Desaprobada"
      //           }).then(estadoDesaprobado => {
      //             CXMEncontrada.estado = estadoDesaprobado._id;
      //             CXMEncontrada.promedio = 0;
      //             CXMEncontrada.save();
      //           });
      //         }
      //       }
      //     }
      //   );
      // });
    });
  }
);

async function saveAprobada(CXMEncontrada, estadoAprobado, promedioGral){
  console.log('promediogral'+promedioGral);
  CXMEncontrada.estado = estadoAprobado._id;
  CXMEncontrada.promedio = promedioGral;
  await CXMEncontrada.save().then(() => {
    console.log(CXMEncontrada);
  });
}

module.exports = router;
