const mongoose = require("mongoose");

const suscripcionSchema = mongoose.Schema({
  endpoint: String,
  expirationTime: Number,
  p256dh: String,
  auth: String
});

const usuarioSchema = mongoose.Schema({
  email: String,
  password: String,
  suscripciones: [suscripcionSchema]
});

module.exports = mongoose.model("usuarios", usuarioSchema, "usuarios");
