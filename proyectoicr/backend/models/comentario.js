const mongoose = require('mongoose');

const comentarioSchema= mongoose.Schema({
  idUsuario: {type: mongoose.Schema.Types.ObjectId, ref: 'usuario'},
  comentario: String,
  fecha: Date
});

module.exports= mongoose.model('comentario', comentarioSchema, 'comentario');
