const mongoose = require('mongoose');

const horarioSchema = mongoose.Schema({
  dia: String,
  moduloInicio: String,
  moduloFin: String
});

module.exports= mongoose.model('horario', horarioSchema, "horario");
