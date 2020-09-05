const mongoose = require("mongoose");

const cicloLectivoSchema = mongoose.Schema({
  horarioLLegadaTarde: Number,
  horarioRetiroAnticipado: Number,
  cantidadFaltasSuspension: Number,
  cantidadMateriasInscripcionLibre: Number,
  año: Number,
  estado: { type: mongoose.Schema.Types.ObjectId, ref: "estado" },
});

module.exports = mongoose.model(
  "cicloLectivo",
  cicloLectivoSchema,
  "cicloLectivo"
);
