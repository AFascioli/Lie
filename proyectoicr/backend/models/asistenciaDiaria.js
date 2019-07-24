const mongoose = require('mongoose');

const asistenciaDiariaSchema= mongoose.Schema({
  IdInscripcion: {type: mongoose.Schema.Types.ObjectId, ref: 'inscripcion'},
  fecha: Date,
  presente: Boolean,
  retiroAnticipado: Boolean,
  valorInasistencia: Number
});

module.exports= mongoose.model('asistenciaDiaria', asistenciaDiariaSchema, 'asistenciaDiaria');
