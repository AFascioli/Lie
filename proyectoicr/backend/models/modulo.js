const mongoose = require('mongoose');

const moduloSchema = mongoose.Schema({
  numero: Number,
  horaInicio: String,
  horaFin: String
});

module.exports= mongoose.model('modulo', moduloSchema, "modulo");
