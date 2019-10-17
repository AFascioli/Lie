const mongoose = require('mongoose');

const nacionalidadSchema = mongoose.Schema({
  id: Number,
  name: String
});

module.exports= mongoose.model("nacionalidad", nacionalidadSchema,"nacionalidad");
