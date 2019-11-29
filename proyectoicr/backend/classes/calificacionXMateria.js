exports.obtenerPromedioDeTrimestre = function(calificaciones) {
  let contador = 0;
  let promedioTrimestre = 0;
  calificaciones.forEach(calificacion => {
    if (calificacion != 0) {
      contador = contador + 1;
      promedioTrimestre += calificacion;
    }
  });

  if (contador != 0) {
    promedioTrimestre = promedioTrimestre / contador;
  }

  return promedioTrimestre;
};

