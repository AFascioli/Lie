const mongoose = require("mongoose");

const cicloLectivoSchema = mongoose.Schema({
  horarioLLegadaTarde: Number,
  horarioRetiroAnticipado: Number,
  cantidadFaltasSuspension: Number,
  cantidadMateriasInscripcionLibre: Number,
  año: Number,
});

module.exports = mongoose.model(
  "cicloLectivo",
  cicloLectivoSchema,
  "cicloLectivo"
);
