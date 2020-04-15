const mongoose = require("mongoose");

const diccionarioSchema = mongoose.Schema({
  comentarios_apropiados: [String],
  comentarios_inapropiados: [String],
  diccionario: {},
});

module.exports = mongoose.model(
  "diccionario",
  diccionarioSchema,
  "diccionario"
);
