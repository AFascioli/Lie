const mongoose = require("mongoose");

const documentosSchema = mongoose.Schema({
  nombre: String,
  entregado: Boolean,
});

const cuotasSchema = mongoose.Schema({
  mes: Number,
  pagado: Boolean,
});

const sancionSchema = mongoose.Schema({
  tipo: String,
  cantidad: Number,
  fecha: Date,
});

const inscripcionSchema = mongoose.Schema({
  idEstudiante: { type: mongoose.Schema.Types.ObjectId, ref: "estudiante" },
  idCurso: { type: mongoose.Schema.Types.ObjectId, ref: "curso" },
  asistenciaDiaria: [
    { type: mongoose.Schema.Types.ObjectId, ref: "asistenciaDiaria" },
  ],
  documentosEntregados: [documentosSchema],
  calificacionesXMateria: [
    { type: mongoose.Schema.Types.ObjectId, ref: "calificacionesXMateria" },
  ],
  contadorInasistenciasInjustificada: { type: Number },
  contadorInasistenciasJustificada: { type: Number },
  contadorLlegadasTarde: { type: Number },
  estado: { type: mongoose.Schema.Types.ObjectId, ref: "estado" },
  cicloLectivo: { type: mongoose.Schema.Types.ObjectId, ref: "cicloLectivo" },
  materiasPendientes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "calificacionesXMateria" },
  ],
  cuotas: [cuotasSchema],
  sanciones: [sancionSchema],
});

module.exports = mongoose.model(
  "inscripcion",
  inscripcionSchema,
  "inscripcion"
);
