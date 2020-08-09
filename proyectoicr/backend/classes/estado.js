const Estado = require("../models/estado");

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
