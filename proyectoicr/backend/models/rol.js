const mongoose = require('mongoose');

const rolSchema = mongoose.Schema({
  tipo: String,
  permisos: {type: mongoose.Schema.Types.ObjectId, ref: "permisos"}
});

module.exports= mongoose.model('roles', rolSchema,'roles');
