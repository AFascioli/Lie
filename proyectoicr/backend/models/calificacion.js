const mongoose = require('mongoose');

const calificacionSchema = mongoose.Schema({
  fecha: Date,
  valor: Number
});

module.exports= mongoose.model('calificacion', calificacionSchema, 'calificacion');
