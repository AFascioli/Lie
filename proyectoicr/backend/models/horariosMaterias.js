const mongoose = require("mongoose");

const horariosMateriaSchema = mongoose.Schema({
  horarios: String,
  materia: { type: mongoose.Schema.Types.ObjectId, ref: "materias" }
});

module.exports = mongoose.model(
  "horariosMaterias",
  horariosMateriaSchema,
  "horariosMaterias"
);
