const mongoose = require('mongoose');

const materiaSchema = mongoose.Schema({
  nombre: String
});

module.exports= mongoose.model('materia', materiaSchema, "materia");
