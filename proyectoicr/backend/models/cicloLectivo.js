const mongoose = require("mongoose");

const cicloLectivoSchema = mongoose.Schema({
  horarioLLegadaTardeAntes: String,
  horarioLLegadaTardeDespues: String,
  horarioRetiroAnticipadoAntes: String,
  horarioRetiroAnticipadoDespues: String,
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
