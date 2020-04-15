var mimir = require("mimir");
var clasificador = require("../assets/funcionNN");
const Diccionario = require("../models/diccionario");

comparacionApropiado = function (a, b) {
  if (a > b && b < 0.7) {
    return true;
  } else {
    return false;
  }
};

module.exports = (req, res, next) => {
  Diccionario.findOne()
    .then((diccionario) => {
      bow_comentario = mimir.bow(
        req.body.comentario.cuerpo,
        diccionario.diccionario
      );
      prediccionario = clasificador.funcion(bow_comentario);

      if (comparacionApropiado(prediccionario["0"], prediccionario["1"])) {
        next();
      } else {
        return res.status(200).json({
          exito: false,
          message: "El comentario no es considerado apropiado",
        });
      }
    })
    .catch((error) => {
      return res.status(500).json({
        message: "Ocurrió un error al clasificar el comentario.",
        descripción: error.message,
      });
    });
};
