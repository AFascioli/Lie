exports.obtenerAñoHabilitado = function (inscripcion) {
  let añoActual;
  let siguiente;
  añoActual = parseInt(inscripcion[0].cursoActual[0].nombre, 10);

  if (inscripcion[0].estadoInscripcion[0].nombre == "Promovido" ||
  inscripcion[0].estadoInscripcion[0].nombre == "Promovido con examenes pendientes") {
    siguiente = añoActual + 1;
  } else {
    siguiente = añoActual;
  }

  return siguiente;
};
