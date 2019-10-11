const mongoose = require('mongoose');

const cursoSchema= mongoose.Schema({
  curso: String,
  materias: [{type: mongoose.Schema.Types.ObjectId, ref: 'materiasXCurso'}]
});

module.exports= mongoose.model('curso', cursoSchema, 'curso');
