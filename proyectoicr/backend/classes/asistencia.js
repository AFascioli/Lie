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
