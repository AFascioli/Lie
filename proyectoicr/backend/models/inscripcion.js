const mongoose = require('mongoose');

const asistenciaSchema= mongoose.Schema({
  fecha: Date,
  presente: Boolean
});

const inscripcionSchema = mongoose.Schema({
  IdEstudiante: {type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes'},
  IdDivision: {type: mongoose.Schema.Types.ObjectId, ref: 'divisiones'},
  asistenciaDiaria: {type: [asistenciaSchema]}
});

module.exports= mongoose.model('inscripcion', inscripcionSchema, 'inscripcion');
