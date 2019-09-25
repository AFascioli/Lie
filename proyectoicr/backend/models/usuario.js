const mongoose = require("mongoose");

const usuarioSchema = mongoose.Schema({
  email: String,
  password: String,
  suscripciones: [Object]
});

module.exports = mongoose.model("usuarios", usuarioSchema, "usuarios");
