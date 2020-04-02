const mongoose = require('mongoose');

const asistenciaDiariaSchema= mongoose.Schema({
  idInscripcion: {type: mongoose.Schema.Types.ObjectId, ref: 'inscripcion'},
  fecha: Date,
  presente: Boolean,
  retiroAnticipado: Boolean,
  valorInasistencia: Number,
  llegadaTarde: Number,
  justificado: Boolean
});

module.exports= mongoose.model('asistenciaDiaria', asistenciaDiariaSchema, 'asistenciaDiaria');
