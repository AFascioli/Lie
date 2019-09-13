const mongoose = require('mongoose');

const nacionalidadSchema = mongoose.Schema({
  id: Number,
  name: String
});
// El tercer parametro es el nombre de la collection, se lo tuve que setear manualmente porque agregaba una "s" magica
module.exports= mongoose.model("nacionalidad", nacionalidadSchema,"nacionalidad");
