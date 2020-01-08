const mongoose = require("mongoose");

const cicloLectivoSchema = mongoose.Schema({
  fechaInicioInscricpcion: Date,
  fechaFinInscripcion: Date,
  fechaInicioPrimerTrimestre: Date,
  fechaFinPrimerTrimestre: Date,
  fechaInicioSegundoTrimestre: Date,
  fechaFinSegundoTrimestre: Date,
  fechaInicioTercerTrimestre: Date,
  fechaFinTercerTrimestre: Date,
  fechaInicioExamenes: Date,
  fechaFinExamenes: Date,
  año: Number
});

module.exports = mongoose.model(
  "cicloLectivo",
  cicloLectivoSchema,
  "cicloLectivo"
);
