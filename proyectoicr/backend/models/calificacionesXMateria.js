const mongoose = require('mongoose');

const calificacionesXMateriaSchema = mongoose.Schema({
  idMateria: { type: mongoose.Schema.Types.ObjectId, ref: "materias" },
  calificaciones: [Number],
  trimestre: Number

});

module.exports= mongoose.model('calificacionesXMateria', calificacionesXMateriaSchema, 'calificacionesXMateria');
