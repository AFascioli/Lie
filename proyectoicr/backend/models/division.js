const mongoose = require('mongoose');

const divisionSchema= mongoose.Schema({
  nombre: String,
  IdMateriasXCurso: {type: mongoose.Schema.Types.ObjectId, ref: 'materiasXCurso'}
});

module.exports= mongoose.model('divisiones', divisionSchema, 'divisiones');
