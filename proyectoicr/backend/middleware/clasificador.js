var mimir = require("mimir");
var clasificador = require("../assets/funcionNN");
const Diccionario = require("../models/diccionario");

let arrayPalabrasInapropiadas = [
  "fachos",
  "puta",
  "puto",
  "putos",
  "putas",
  "conchuda",
  "conchudo",
  "conchudos",
  "conchudas",
  "miserables",
  "miserable",
  "estupido",
  "estupida",
  "estupidas",
  "estupidos",
  "marica",
  "maricon",
  "boludos",
  "boludas",
  "boludo",
  "boluda",
  "pelotudos",
  "pelotudas",
  "pelotudo",
  "pelotuda",
  "imbecil",
  "imbeciles",
  "mogolicos",
  "mogolico",
  "prostituta",
  "prostitutas",
  "culiada",
  "culiadas",
  "culiado",
  "culiados",
  "culo",
  "pito",
  "pija",
  "teta",
  "tetas",
  "concha",
  "conchas",
  "reputisima",
  "mataria",
  "bosta",
  "mierda",
  "violar",
  "violaria",
  "semen",
  "caca",
  "bosta",
  "ano",
];

sonPalabrasApropiadas = function (cuerpo) {
  cuerpo = cuerpo.toString().toLowerCase();
  cuerpo = cuerpo.replace(/[!@#$%^&*(),.?¿¡":{}|<>]/," ");
  cuerpo = cuerpo.trim();

  for (const palabra of arrayPalabrasInapropiadas) {
      if (cuerpo.toString().indexOf(palabra) != -1) {
        return false;
      }
  }
  return true;
};

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
      if (!sonPalabrasApropiadas(req.body.comentario.cuerpo)) {
        return res.status(200).json({
          exito: false,
          message: "El comentario no es considerado apropiado",
        });
      }

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
