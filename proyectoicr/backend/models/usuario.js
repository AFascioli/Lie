const mongoose = require("mongoose");

const usuarioSchema = mongoose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  rol: {type: mongoose.Schema.Types.ObjectId, ref: "rol"},
  suscripciones: [Object]
});

module.exports = mongoose.model("usuario", usuarioSchema, "usuario");
