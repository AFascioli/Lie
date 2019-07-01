const mongoose = require('mongoose');

const asistenciaSchema = mongoose.Schema({
  fecha: {type: Date, required: true},
  presente: {type: Boolean, default: false},
  idEstudiante: {type: String}
});

module.exports= mongoose.model('asistencias', asistenciaSchema, 'asistencias');
