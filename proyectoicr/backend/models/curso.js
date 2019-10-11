const mongoose = require('mongoose');

const cursoSchema= mongoose.Schema({
  curso: String,
  agenda: [{type: mongoose.Schema.Types.ObjectId, ref: 'horariosMaterias'}]
});

module.exports= mongoose.model('curso', cursoSchema, 'curso');
