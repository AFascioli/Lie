const mongoose = require('mongoose');

const nacionalidadSchema = mongoose.Schema({
  code: String,
  name: String
});

module.exports= mongoose.model('nacionalidad', nacionalidadSchema);
