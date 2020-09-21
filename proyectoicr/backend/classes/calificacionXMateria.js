const CalificacionesXTrimestre = require("../models/calificacionesXTrimestre");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const Inscripcion = require("../models/inscripcion");
const ClaseEstado = require("../classes/estado");
const ClaseCicloLectivo = require("../classes/cicloLectivo");
const mongoose = require("mongoose");

exports.obtenerPromedioDeTrimestre = function (calificaciones) {
  let contador = 0;
  let promedioTrimestre = 0;
  calificaciones.forEach((calificacion) => {
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

exports.crearCalifXTrimestre = async function (califXMateriaNueva) {
  let idsCalXMateria = [];
  let idsCalificacionMatXTrim = [];
  //vas a crear las calificacionesXTrimestre de cada materia
  for (let i = 0; i < 3; i++) {
    let calificacionesXTrim = new CalificacionesXTrimestre({
      calificaciones: [0, 0, 0, 0, 0, 0],
      trimestre: i + 1,
    });
    calificacionesXTrim.save().then(async (calXMateriaXTrimestre) => {
      await idsCalificacionMatXTrim.push(calXMateriaXTrimestre._id);
      califXMateriaNueva.calificacionesXTrimestre = idsCalificacionMatXTrim;
      califXMateriaNueva.save();
    });
    if ((i = 3)) {
      idsCalXMateria.push(califXMateriaNueva._id);

      return idsCalXMateria;
    }
  }
};

// Deprecado
exports.crearDocsCalif = async function (materiasDelCurso, estado) {
  let idsCalXMateria = [];
  materiasDelCurso.forEach((elemento) => {
    let califXMateriaNueva = new CalificacionesXMateria({
      idMateria: elemento.materiasDelCurso[0].materia,
      estado: estado._id,
      calificacionesXTrimestre: idsCalXMateria,
    });

    //Creamos las califXMateria
    this.crearCalifXTrimestre(califXMateriaNueva).then(
      async (idsCalificacionMat) => {
        return await idsCalificacionMat;
      }
    );
  });
};

//Crear todas las CalificacionXMateria necesarias con sus respectivas CalificacionesXTrimestre
//@param: Array con ids de las materias de un curso
//@param: Id del estado Cursando de CalificacionXMateria
exports.crearCXM = async function (materiasDelCurso, estado) {
  var obtenerCXT = (trimestre) => {
    return new Promise((resolve, reject) => {
      let calificacionesXTrim = new CalificacionesXTrimestre({
        calificaciones: [0, 0, 0, 0, 0, 0],
        trimestre: trimestre,
      });
      calificacionesXTrim.save().then(async (calXMateriaXTrimestre) => {
        resolve(calXMateriaXTrimestre._id);
      });
    });
  };

  var obtenerCXMParaInscripcion = (idMateria, estado) => {
    return new Promise(async (resolve, reject) => {
      let idsCXT = [];
      //Se crean las CXT
      for (let i = 0; i < 3; i++) {
        var idCXT = await obtenerCXT(i + 1);
        idsCXT.push(idCXT);
      }
      let califXMateriaNueva = new CalificacionesXMateria({
        idMateria: idMateria,
        estado: estado,
        calificacionesXTrimestre: idsCXT,
      });

      //Se guarda la CXM y se devuelve la id
      califXMateriaNueva.save().then((cxmNueva) => {
        resolve(cxmNueva._id);
      });
    });
  };

  var idsCalXMateria = [];
  for (const materia of materiasDelCurso) {
    var idCXM = await obtenerCXMParaInscripcion(materia._id, estado._id);
    idsCalXMateria.push(idCXM);
  }
  return idsCalXMateria;
};

//Obtiene las CalificacionesXMateria desaprobadas. Retorna las ids de las CXM desaprobadas y pendientes
//@param: array con las ids de las CalificacionesXMateria
//@param: id del estado Desaprobada
exports.obtenerMateriasDesaprobadasv2 = async function (
  arrayPendientes,
  idsCalificacionesXMateria,
  idEstado
) {
  return new Promise(async (resolve, reject) => {
    var idsCXMDesaprobadas = [];
    if (arrayPendientes.length != 0) {
      idsCXMDesaprobadas.push(arrayPendientes);
    }
    for (const cxm of idsCalificacionesXMateria) {
      await CalificacionesXMateria.findOne({ _id: cxm, estado: idEstado })
        .then((cxmEncontrada) => {
          if (cxmEncontrada != null) {
            idsCXMDesaprobadas.push(cxm);
          }
        })
        .catch(() => reject("Error"));
    }
    resolve(idsCXMDesaprobadas);
  });
};

//Dados los 3 vectores de calificaciones calcula el promedio total
//@param: vector de calificaciones 1, 2 y 3 trimestre
exports.obtenerPromedioTotal = (trimestre1, trimestre2, trimestre3) => {
  return (
    (this.obtenerPromedioDeTrimestre(trimestre1) +
      this.obtenerPromedioDeTrimestre(trimestre2) +
      this.obtenerPromedioDeTrimestre(trimestre3)) /
    3
  );
};

//Dados los 3 vectores de calificaciones modifica estado y promedio de la CXM segun correspondaf
//que tendra la CXM correspondiente
//@param: vector de calificaciones 1, 2 y 3 trimestre, y idCXM a cambiar
exports.obtenerEstadoYPromedioCXM = async (
  trimestre1,
  trimestre2,
  trimestre3,
  idCXM
) => {
  let promedioTrimestre3 = this.obtenerPromedioDeTrimestre(trimestre3);
  let promedioGeneral = this.obtenerPromedioTotal(
    trimestre1,
    trimestre2,
    trimestre3
  );

  const idEstadoAprobada = await ClaseEstado.obtenerIdEstado(
    "CalificacionesXMateria",
    "Aprobada"
  );
  const idEstadoDesaprobada = await ClaseEstado.obtenerIdEstado(
    "CalificacionesXMateria",
    "Desaprobada"
  );

  if (promedioTrimestre3 < 6 || promedioGeneral < 6) {
    await CalificacionesXMateria.findByIdAndUpdate(idCXM, {
      estado: idEstadoDesaprobada,
      promedio: promedioGeneral,
    });
  } else {
    await CalificacionesXMateria.findByIdAndUpdate(idCXM, {
      estado: idEstadoAprobada,
      promedio: promedioGeneral,
    });
  }
};

//Dado un array de ids de cxm, obtiene el nombre e id de las materias
exports.obtenerNombresMaterias = async (arrayIdCXM) => {
  return new Promise(async (resolve, reject) => {
    let nombresMaterias = [];
    for (const idCxm of arrayIdCXM) {
      await CalificacionesXMateria.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(idCxm),
          },
        },
        {
          $lookup: {
            from: "materia",
            localField: "idMateria",
            foreignField: "_id",
            as: "datosMateria",
          },
        },
        {
          $project: {
            "datosMateria._id": 1,
            "datosMateria.nombre": 1,
          },
        },
      ]).then((datosMaterias) => {
        nombresMaterias.push(datosMaterias[0].datosMateria[0]);
      });
    }
    resolve(nombresMaterias);
  });
};

//Filtra inscripciones segun curso, luego filtrar CXM segun idMateria, calcula promedio y cambia estado de CXM
//@params: idCurso e idMateria
exports.cerrarMateriaTercerTrimestre = (idCurso, idMateria) => {
  return new Promise(async (resolve, reject) => {
    const idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    const idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    const idCicloActual = await ClaseCicloLectivo.obtenerIdCicloLectivo(false);
    
    const inscripcionesFiltradas = await Inscripcion.aggregate([
      {
        $match: {
          idCurso: mongoose.Types.ObjectId(idCurso),
          cicloLectivo: mongoose.Types.ObjectId(idCicloActual),
          estado: {
            $in: [
              mongoose.Types.ObjectId(idEstadoActiva),
              mongoose.Types.ObjectId(idEstadoSuspendido),
            ],
          },
        },
      },
      {
        $lookup: {
          from: "calificacionesXMateria",
          localField: "calificacionesXMateria",
          foreignField: "_id",
          as: "datosCXM",
        },
      },
      {
        $unwind: {
          path: "$datosCXM",
        },
      },
      {
        $match: {
          "datosCXM.idMateria": mongoose.Types.ObjectId(idMateria),
        },
      },
      {
        $lookup: {
          from: "calificacionesXTrimestre",
          localField: "datosCXM.calificacionesXTrimestre",
          foreignField: "_id",
          as: "datosCXT",
        },
      },
      {
        $project: {
          "datosCXT.calificaciones": 1,
          "datosCXM._id": 1,
        },
      },
    ]);

    for (const inscripcion of inscripcionesFiltradas) {
      await this.obtenerEstadoYPromedioCXM(
        inscripcion.datosCXT[0].calificaciones,
        inscripcion.datosCXT[1].calificaciones,
        inscripcion.datosCXT[2].calificaciones,
        inscripcion.datosCXM._id
      );
    }
    resolve();
  });
};
