const mongoose = require("mongoose");

const comentarioSchema = mongoose.Schema({
  idUsuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuario" },
  cuerpo: String,
  nombre: String,
  apellido: String,
  fecha: Date
});

const eventoSchema = mongoose.Schema({
  titulo: String,
  descripcion: String,
  fechaEvento: Date,
  horaInicio: String,
  horaFin: String,
  tags: [String],
  imgUrl: String,
  autor: { type: mongoose.Schema.Types.ObjectId, ref: "usuario" },
  comentarios: [comentarioSchema]
});

module.exports = mongoose.model("evento", eventoSchema, "evento");
