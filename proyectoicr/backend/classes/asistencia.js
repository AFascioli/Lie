const AsistenciaDiaria = require("../models/asistenciaDiaria");

exports.esFechaActual = async function(fecha) {
  fechaHoy = new Date();
  if (
    fechaHoy.getDate() == fecha.getDate() &&
    fechaHoy.getMonth() == fecha.getMonth() &&
    fechaHoy.getFullYear() == fecha.getFullYear()
  )
   return true;
  else return false;
};
exports.actualizarAsistenciaDiaria = async function(estudiante) {
  fechaHoy = new Date();
  const asistenciaDiaria = new AsistenciaDiaria({
    _id: estudiante.datosEstudiante[0]._id,
    nombre: estudiante.datosEstudiante[0].nombre,
    apellido: estudiante.datosEstudiante[0].apellido,
    idAsistencia: estudiante.asistencia[0]._id,
    fecha: fechaHoy,
    presente: estudiante.asistencia[0].presente
  });
  return asistenciaDiaria;
};

exports.crearAsistenciaDiaria = async function(estudiante) {
  fechaHoy = new Date();
  const asistenciaDiaria = new AsistenciaDiaria({
    _id: estudiante.estudiante[0]._id,
    nombre: estudiante.estudiante[0].nombre,
    apellido: estudiante.estudiante[0].apellido,
    fecha: fechaHoy,
    presente: true
  });
  return asistenciaDiaria;
};

exports.validarFechasJustificar = function(cicloLectivo){
  let fechaActual = new Date();

  if (
    fechaActual >= cicloLectivo.fechaInicioPrimerTrimestre &&
    fechaActual <= cicloLectivo.fechaFinPrimerTrimestre
  ) {
    return true;
  } else if (
    fechaActual >= cicloLectivo.fechaInicioSegundoTrimestre &&
    fechaActual <= cicloLectivo.fechaFinSegundoTrimestre
  ) {
    return true;
  } else if (
    fechaActual >= cicloLectivo.fechaInicioTercerTrimestre &&
    fechaActual <= cicloLectivo.fechaFinTercerTrimestre
  ) {
    return true;
  }
  return false;
}
