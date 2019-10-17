const mongoose = require('mongoose');

const rolSchema = mongoose.Schema({
  tipo: String,
  permisos: {type: mongoose.Schema.Types.ObjectId, ref: "permiso"}
});

module.exports= mongoose.model('rol', rolSchema,'rol');
