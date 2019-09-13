const mongoose = require('mongoose');

const usuarioSchema = mongoose.Schema({
  email: String,
  password: String
});

module.exports= mongoose.model('usuarios', usuarioSchema,'usuarios');
