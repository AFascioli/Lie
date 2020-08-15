const mongoose = require("mongoose");

const cursoSchema = mongoose.Schema({
  nombre: String,
  materias: [{ type: mongoose.Schema.Types.ObjectId, ref: "materiasXCurso" }],
  capacidad: Number,
  cicloLectivo: [{ type: mongoose.Schema.Types.ObjectId, ref: "cicloLectivo" }],
});

module.exports = mongoose.model("curso", cursoSchema, "curso");
