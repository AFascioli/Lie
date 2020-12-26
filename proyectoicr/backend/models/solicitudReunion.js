const mongoose = require("mongoose");

const usuarioSchema = mongoose.Schema({
  fecha: {type: Date, required: true},
  idDocente: { type: mongoose.Schema.Types.ObjectId, ref: "empleado" },
  idAdultoResponsable: { type: mongoose.Schema.Types.ObjectId, ref: "idAdultoResponsable" },
});

module.exports = mongoose.model("solicitudReunion", usuarioSchema, "solicitudReunion");
