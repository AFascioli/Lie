const mongoose = require('mongoose');

const horarioSchema = mongoose.Schema({
  dia: String,
  horaInicio: String,
  horaFin: String
});

module.exports= mongoose.model('horario', horarioSchema, "horario");
