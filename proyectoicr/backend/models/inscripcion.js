const mongoose = require('mongoose');

const inscripcionSchema = mongoose.Schema({
  IdEstudiante: {type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes'},
  IdDivision: {type: mongoose.Schema.Types.ObjectId, ref: 'divisiones'},
  asistenciaDiaria: [{type: mongoose.Schema.Types.ObjectId, ref: 'asistenciaDiaria'}],
  activa: {type: Boolean, require: true}
});

module.exports= mongoose.model('inscripcion', inscripcionSchema, 'inscripcion');
