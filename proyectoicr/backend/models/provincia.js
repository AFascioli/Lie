const mongoose = require('mongoose');

const provinciaSchema = mongoose.Schema({
  id: Number,
  nombre: String
});

module.exports= mongoose.model('Provincias', provinciaSchema);
