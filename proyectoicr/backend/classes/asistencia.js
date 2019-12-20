const asistenciaDiaria = require("../models/asistenciaDiaria");
exports.esFechaActual = async function(fecha) {
  fechaHoy = new Date();
  if (
    fechaHoy.getDate() == fecha.getDate() &&
    fechaHoy.getMonth() == fecha.getMonth() &&
    fechaHoy.getFullYear() == fecha.getFullYear()
  )
    true;
  else false;
};
exports.crearAsistenciaDiaria = async function(estudiante) {
  fechaHoy = new Date();
  let asistenciaDiaria = new asistenciaDiaria({
    _id: estudiante.datosEstudiante[0]._id,
    nombre: estudiante.datosEstudiante[0].nombre,
    apellido: estudiante.datosEstudiante[0].apellido,
    idAsistencia: estudiante.asistencia[0]._id,
    fecha: fechaHoy,
    presente: estudiante.asistencia[0].presente
  });
};

