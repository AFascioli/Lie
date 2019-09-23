const mongoose = require('mongoose');

const usuarioSchema = mongoose.Schema({
  email: String,
  password: String,
  rol: {type: mongoose.Schema.Types.ObjectId, ref: "roles"}
});

module.exports= mongoose.model('usuarios', usuarioSchema,'usuarios');
