const mongoose = require('mongoose');

const eventoSchema = mongoose.Schema({
  titulo: String,
  descripcion: String,
  fechaEvento: Date,
  horaInicio: String,
  horaFin: String,
  tags: [String],
  imgUrl: String,
  autor: {type: mongoose.Schema.Types.ObjectId, ref: "usuario"},
  comentarios: [{type: mongoose.Schema.Types.ObjectId, ref: "comentario"}]
});

module.exports= mongoose.model('evento', eventoSchema, "evento");
