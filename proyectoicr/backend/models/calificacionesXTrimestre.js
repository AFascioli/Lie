const mongoose = require('mongoose');

const calificacionesXTrimestreSchema = mongoose.Schema({
  calificaciones: [Number],
  trimestre: Number
});

module.exports= mongoose.model('calificacionesXTrimestre', calificacionesXTrimestreSchema, 'calificacionesXTrimestre');
