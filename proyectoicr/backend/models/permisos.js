const mongoose = require('mongoose');

const permisoSchema = mongoose.Schema({
  notas: Number,
  asistencia: Number,
  eventos: Number,
  sanciones: Number,
  agendaCursos: Number,
  inscribirEstudiante: Number,
  registrarEmpleado: Number,
  cuotas: Number
});

module.exports= mongoose.model('permisos', permisoSchema,'permisos');
