const mongoose = require('mongoose');

const rolSchema = mongoose.Schema({
  tipo: String,
  permisos: String
});

module.exports= mongoose.model('rol', rolSchema,'rol');
