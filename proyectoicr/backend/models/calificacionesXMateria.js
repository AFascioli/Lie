const mongoose = require('mongoose');

const calificacionesXMateriaSchema = mongoose.Schema({
  idMateria: { type: mongoose.Schema.Types.ObjectId, ref: "materias" },
  estado: { type: mongoose.Schema.Types.ObjectId, ref: "estado" },
  calificacionesXTrimestre: [{ type: mongoose.Schema.Types.ObjectId, ref: "calificacionesXTrimestre" }],
  promedio: Number
});

module.exports= mongoose.model('calificacionesXMateria', calificacionesXMateriaSchema, 'calificacionesXMateria');
