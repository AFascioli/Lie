const mongoose = require("mongoose");

const materiasXCursoSchema = mongoose.Schema({
  horarios: [{ type: mongoose.Schema.Types.ObjectId, ref: "horario" }],
  materia: { type: mongoose.Schema.Types.ObjectId, ref: "materia" },
  idDocente: { type: mongoose.Schema.Types.ObjectId, ref: "empleado" },
});

module.exports = mongoose.model(
  "materiasXCurso",
  materiasXCursoSchema,
  "materiasXCurso"
);
