const mongoose = require('mongoose');

const materiasXCursoSchema= mongoose.Schema({
  curso: Number,
  materias: [String]
});

module.exports= mongoose.model('materiasXCurso', materiasXCursoSchema, 'materiasXCurso');
