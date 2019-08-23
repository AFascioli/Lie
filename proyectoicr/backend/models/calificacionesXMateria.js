const mongoose = require('mongoose');

const calificacionesXMateriaSchema = mongoose.Schema({
  idMateria: { type: mongoose.Schema.Types.ObjectId, ref: "materias" },
  calificaciones: [{ type: mongoose.Schema.Types.ObjectId, ref: "calificaciones" }],
  trimestre: Number

});

module.exports= mongoose.model('calificacionesXMaterias', calificacionesXMateriaSchema, 'calificacionesXMaterias');
