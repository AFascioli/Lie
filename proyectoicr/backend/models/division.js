const mongoose = require('mongoose');

const divisionSchema= mongoose.Schema({
  curso: String,
  agenda: [{type: mongoose.Schema.Types.ObjectId, ref: 'horariosMaterias'}]
});

module.exports= mongoose.model('divisiones', divisionSchema, 'divisiones');
