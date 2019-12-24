const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const CalificacionesXMateria = require("../models/calificacionesXMateria");

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
exports.obtenerMateriasDesaprobadas = async function(
  arrayPendientes,
  arrayCXMTotal,
  arrayNombresCXM
) {
  materiasDesaprobadas = [];
  if (arrayPendientes.length != 0) {
    materiasDesaprobadas.push(arrayPendientes);
  }

  for (i = 0; i < arrayCXMTotal.length - 1; i++) {
    if (arrayCXMTotal[i].promedio == 0) {
      for (j = 0; j < arrayNombresCXM.length - 1; j++) {
        //Necesita el casteo sino me lo compara mal
        if (
          arrayNombresCXM[j]._id.toString() ===
          arrayCXMTotal[i].idMateria.toString()
        ) {
          materiasDesaprobadas.push(arrayNombresCXM[j]);
        }
      }
    }
  }

  return materiasDesaprobadas;
};

exports.crearCalifXTrimestre = async function(califXMateriaNueva) {
  let idsCalXMateria = [];
  let idsCalificacionMatXTrim = [];
  //vas a crear las calificacionesXTrimestre de cada materia
  for (let i = 0; i < 3; i++) {
    let calificacionesXTrim = new CalificacionesXTrimestre({
      calificaciones: [0, 0, 0, 0, 0, 0],
      trimestre: i + 1
    });
    calificacionesXTrim.save().then(async calXMateriaXTrimestre => {
      await idsCalificacionMatXTrim.push(calXMateriaXTrimestre._id);
      califXMateriaNueva.calificacionesXTrimestre = idsCalificacionMatXTrim;
      califXMateriaNueva.save();
      console.log('lo pusheo');
    });
    if(i = 3){
      console.log('ahora se ejecuto');
     idsCalXMateria.push(califXMateriaNueva._id);

      return idsCalXMateria;
    }
  }
};

exports.crearDocsCalif = async function(materiasDelCurso, estado) {
  let idsCalXMateria = [];
  materiasDelCurso.forEach(elemento => {
 let califXMateriaNueva = new CalificacionesXMateria({
        idMateria: elemento.materiasDelCurso[0].materia,
        estado: estado._id,
        calificacionesXTrimestre: idsCalXMateria
      });

    //Creamos las califXMateria
    this.crearCalifXTrimestre(califXMateriaNueva).then(async idsCalificacionMat => {
      console.log('se ejecuto');
      console.log(idsCalificacionMat);
    return await idsCalificacionMat;

    });
  });

};
