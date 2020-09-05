const mongoose = require("mongoose");

const materiasXCursoSchema = mongoose.Schema({
  horarios: [{ type: mongoose.Schema.Types.ObjectId, ref: "horario" }],
  idMateria: { type: mongoose.Schema.Types.ObjectId, ref: "materia" },
  idDocente: { type: mongoose.Schema.Types.ObjectId, ref: "empleado" },
  estado: { type: mongoose.Schema.Types.ObjectId, ref: "estado" },
});

module.exports = mongoose.model(
  "materiasXCurso",
  materiasXCursoSchema,
  "materiasXCurso"
);
