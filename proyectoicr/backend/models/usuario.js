const mongoose = require("mongoose");

const usuarioSchema = mongoose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  rol: {type: mongoose.Schema.Types.ObjectId, ref: "roles"}
});

module.exports = mongoose.model("usuarios", usuarioSchema, "usuarios");
