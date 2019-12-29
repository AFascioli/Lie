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
      console.log("lo pusheo");
    });
    if ((i = 3)) {
      console.log("ahora se ejecuto");
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
    this.crearCalifXTrimestre(califXMateriaNueva).then(
      async idsCalificacionMat => {
        console.log("se ejecuto");
        console.log(idsCalificacionMat);
        return await idsCalificacionMat;
      }
    );
  });
};

exports.crearCXM = async function(materiasDelCurso, estado){
  var obtenerCXT = (trimestre) => {
    return new Promise((resolve, reject) => {
      let calificacionesXTrim = new CalificacionesXTrimestre({
        calificaciones: [0, 0, 0, 0, 0, 0],
        trimestre: trimestre
      });
      calificacionesXTrim.save().then(async calXMateriaXTrimestre => {
        resolve(calXMateriaXTrimestre._id);
      });
    });
  };

  var obtenerCXMParaInscripcion = (
    idMateria,
    estado
  ) => {
    return new Promise(async (resolve, reject) => {
      let idsCXT= [];
      //Se crean las CXT
      for (let i = 0; i < 3; i++) {
        var idCXT= await obtenerCXT(i+1);
        idsCXT.push(idCXT);
      }
      let califXMateriaNueva = new CalificacionesXMateria({
        idMateria: idMateria,
        estado: estado,
        calificacionesXTrimestre: idsCXT
      });

      //Se guarda la CXM y se devuelve la id
      califXMateriaNueva.save().then(cxmNueva => {
         resolve(cxmNueva._id);
      })
    });
  };
 var idsCalXMateria = [];
  materiasDelCurso.forEach(async elemento => {
    var idCXM= await obtenerCXMParaInscripcion(elemento.materiasDelCurso[0].materia,estado._id);
    idsCalXMateria.push(idCXM);
  });
  return idsCalXMateria;
}
//Obtiene las CalificacionesXMateria desaprobadas. Retorna las ids de las CXM desaprobadas
//@param: array con las ids de las CalificacionesXMateria
//@param: id del estado Desaprobada
exports.obtenerMateriasDesaprobadasv2 = async function(
  idsCalificacionesXMateria,
  idEstado
) {
  var idsCXMDesaprobadas = [];
  idsCalificacionesXMateria.forEach(cxm => {
    CalificacionesXMateria.findOne({ _id: cxm, estado: idEstado }).then(
      cxmEncontrada => {
        if (cxmEncontrada != null) {
          idsCXMDesaprobadas.push(cxm);
        }
      }
    );
  });
  return idsCXMDesaprobadas;
};
