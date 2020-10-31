const Estado = require("../models/estado");
const CicloLectivo = require("../models/cicloLectivo");

//Obtiene la id del estado dado el ambito y el nombre
exports.obtenerIdEstado = (ambito, nombre) => {
  return new Promise((resolve, reject) => {
    Estado.findOne({ nombre: nombre, ambito: ambito })
      .then((estado) => {
        resolve(estado._id);
      })
      .catch((error) => {
        reject("Error: " + error);
      });
  });
};

exports.obtenerIdCicloLectivo = (proximo) => {
  let fechaActual = new Date();
  let año = proximo ? fechaActual.getFullYear() + 1 : fechaActual.getFullYear();
  return new Promise((resolve, reject) => {
    CicloLectivo.findOne({ año: año })
      .then((cicloLectivo) => {
        resolve(cicloLectivo._id);
      })
      .catch((err) => reject(err));
  });
};

exports.getIdCicloLectivo = (año) => {
  return new Promise((resolve, reject) => {
    CicloLectivo.findOne({ año: año })
      .then((cicloLectivo) => {
        console.log(cicloLectivo);
        resolve(cicloLectivo._id);
      })
      .catch((err) => reject(err));
  });
};
