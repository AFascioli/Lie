const Curso = require("../models/curso");

//Retorna un booleano segun si todos los cursos tienen definida la agenda
exports.cursosTienenAgenda = () =>{
  let añoActual = new Date().getFullYear();
  return new Promise((resolve, reject) => {
    Curso.aggregate([
      {
        $lookup: {
          from: "cicloLectivo",
          localField: "cicloLectivo",
          foreignField: "_id",
          as: "datosCicloLectivo",
        },
      },
      {
        $match: {
          "datosCicloLectivo.año": añoActual,
        },
      },
    ]).then((cursosActuales) => {    
      let todosTienenAgenda = cursosActuales.every(
        (curso) => curso.materias.length != 0
      );
      resolve(todosTienenAgenda);
    }).catch(eror =>{
      reject();
    });
  })
}
