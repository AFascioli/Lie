const mongoose = require('mongoose');

const documentosSchema = mongoose.Schema({
  nombre: String,
  entregado: Boolean
});

const inscripcionSchema = mongoose.Schema({
  IdEstudiante: {type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes'},
  IdDivision: {type: mongoose.Schema.Types.ObjectId, ref: 'divisiones'},
  asistenciaDiaria: [{type: mongoose.Schema.Types.ObjectId, ref: 'asistenciaDiaria'}],
  activa: {type: Boolean, require: true},
  documentosEntregados: [documentosSchema],
  calificacionesXMateria: [{type: mongoose.Schema.Types.ObjectId, ref: 'calificacionesXMateria'}],
  contadorInasistencias: {type: Number},
  contadorInasistenciasJustificada: {type: Number}
});

module.exports= mongoose.model('inscripcion', inscripcionSchema, 'inscripcion');
