const mongoose = require("mongoose");

const administradorSchema = mongoose.Schema({
  apellido: { type: String, required: true },
  nombre: { type: String, required: true },
  email: String,
  idUsuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuario" },
});

module.exports = mongoose.model(
  "administrador",
  administradorSchema,
  "administrador"
);
