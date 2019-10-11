const mongoose = require('mongoose');

const documentosSchema = mongoose.Schema({
  nombre: String,
  entregado: Boolean
});

const inscripcionSchema = mongoose.Schema({
  IdEstudiante: {type: mongoose.Schema.Types.ObjectId, ref: 'estudiante'},
  IdDivision: {type: mongoose.Schema.Types.ObjectId, ref: 'curso'},
  asistenciaDiaria: [{type: mongoose.Schema.Types.ObjectId, ref: 'asistenciaDiaria'}],
  activa: {type: Boolean, require: true},
  documentosEntregados: [documentosSchema],
  calificacionesXMateria: [{type: mongoose.Schema.Types.ObjectId, ref: 'calificacionesXMateria'}],
  contadorInasistencias: {type: Number},
  contadorInasistenciasJustificada: {type: Number},
  estado: {type: mongoose.Schema.Types.ObjectId, ref: "estado"}
});

module.exports= mongoose.model('inscripcion', inscripcionSchema, 'inscripcion');
