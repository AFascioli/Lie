const mongoose = require('mongoose');

const materiaSchema = mongoose.Schema({
  nombre: String
});

module.exports= mongoose.model('materias', materiaSchema);
