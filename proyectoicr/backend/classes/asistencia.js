exports.esFechaActual = function (fecha) {
  fechaHoy = new Date();
  if (
    fechaHoy.getDate() == fecha.getDate() &&
    fechaHoy.getMonth() == fecha.getMonth() &&
    fechaHoy.getFullYear() == fecha.getFullYear()
  )
    return true;
  else return false;
};

exports.validarFechasJustificar = function (cicloLectivo) {
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
};
