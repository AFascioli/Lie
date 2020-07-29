const mongoose = require("mongoose");

const preferenciasPushSchema = mongoose.Schema({
  nombre: String,
  acepta: Boolean,
});

const adultoResponsableSchema = mongoose.Schema({
  apellido: { type: String, required: true },
  nombre: { type: String, required: true },
  tipoDocumento: { type: String, required: true },
  numeroDocumento: { type: Number, required: true },
  sexo: { type: String, required: true },
  nacionalidad: String,
  fechaNacimiento: { type: Date, required: true },
  telefono: Number,
  email: String,
  tutor: Boolean,
  idUsuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuario" },
  estudiantes: [{ type: mongoose.Schema.Types.ObjectId, ref: "estudiante" }],
  preferenciasPush: [preferenciasPushSchema],
});

module.exports = mongoose.model(
  "adultoResponsable",
  adultoResponsableSchema,
  "adultoResponsable"
);
