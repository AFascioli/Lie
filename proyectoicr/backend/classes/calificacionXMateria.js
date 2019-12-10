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

// Añade al vector de materias desaprobadas las materias pendientes de otros años y
//las materias del año actual que también se encuentren desaprobadas
exports.obtenerMateriasDesaprobadas = async function(arrayPendientes, arrayCXMTotal, arrayNombresCXM ){
  materiasDesaprobadas = [];
  if (arrayPendientes.length != 0) {
    materiasDesaprobadas.push(arrayPendientes);
  }

  for (i = 0; i < arrayCXMTotal.length - 1; i++) {
    if (arrayCXMTotal[i].promedio == 0) {
      for (j = 0; j < arrayNombresCXM.length-1; j++){
        //Necesita el casteo sino me lo compara mal
        if((arrayNombresCXM[j]._id.toString() === arrayCXMTotal[i].idMateria.toString())){
          materiasDesaprobadas.push(arrayNombresCXM[j]);
        }
      }
    }
  }

  return materiasDesaprobadas;
}

