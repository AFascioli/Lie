const mongoose = require('mongoose');

const localidadSchema = mongoose.Schema({
  id: Number,
  id_provincia: Number,
  nombre: String
});

module.exports= mongoose.model('localidad', localidadSchema, "localidad");
