const mongoose = require("mongoose");
const Curso = require("../models/curso");
const Inscripcion = require("../models/inscripcion");
const Estudiante = require("../models/estudiante");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseEstado = require("../classes/estado");
const ClaseCalifXMateria = require("../classes/calificacionXMateria");

exports.obtenerAñoHabilitado = function (inscripcion, añoLectivo) {
  let añoActual;
  let fechaActual = new Date();
  let siguiente;
  añoActual = parseInt(inscripcion[0].cursoActual[0].nombre, 10);

  if (
    inscripcion[0].estadoInscripcion[0].nombre == "Promovido" ||
    inscripcion[0].estadoInscripcion[0].nombre ==
      "Promovido con examenes pendientes" ||
    añoLectivo > fechaActual.getFullYear()
  ) {
    siguiente = añoActual + 1;
  } else {
    siguiente = añoActual;
  }

  return siguiente;
};

//Dada una id de curso, obtiene las ids de las materias que se dan en ese curso
function obtenerMateriasDeCurso(idCurso) {
  return new Promise((resolve, reject) => {
    Curso.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(idCurso),
        },
      },
      {
        $unwind: "$materias",
      },
      {
        $lookup: {
          from: "materiasXCurso",
          localField: "materias",
          foreignField: "_id",
          as: "materiasDelCurso",
        },
      },
      {
        $group: {
          _id: {
            idMateria: "$materiasDelCurso.idMateria",
          },
        },
      },
    ])
      .then((materiasDelCurso) => {
        resolve(materiasDelCurso);
      })
      .catch((err) => reject(err));
  });
}

module.exports.obtenerMateriasDeCurso = obtenerMateriasDeCurso;

exports.inscribirEstudiante = async function (
  idCurso,
  idEstudiante,
  documentosEntregados
) {
  let obtenerCurso = () => {
    return new Promise((resolve, reject) => {
      Curso.findOne({ _id: idCurso })
        .then((curso) => {
          resolve(curso);
        })
        .catch((err) => reject(err));
    });
  };

  let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
    "Inscripcion",
    "Activa"
  );

  let obtenerInscripcion = () => {
    return new Promise(async (resolve, reject) => {
      let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Activa"
      );
      Inscripcion.findOne({
        idEstudiante: idEstudiante,
        estado: idEstadoActiva,
      })
        .then((inscripcion) => {
          resolve(inscripcion);
        })
        .catch((err) => reject(err));
    });
  };

  let crearCuotas = () => {
    cuotas = [];

    for (let i = 0; i < 12; i++) {
      let cuota = { mes: i + 1, pagado: false };
      cuotas.push(cuota);
    }
    return cuotas;
  };

  let esCambioDeCurso = (idCurso, idCicloLectivo) => {
    return new Promise((resolve, reject) => {
      CicloLectivo.findById(idCicloLectivo)
        .then((cicloLectivo) => {
          if (añoLectivo == cicloLectivo.año) {
            Curso.findByIdAndUpdate(idCurso, { $inc: { capacidad: 1 } }).then(
              () => {
                resolve();
              }
            );
            cuotasAnteriores = inscripcion.cuotas;
          }
        })
        .catch((error) => reject(error));
    });
  };

  let actualizarEstadoEstudiante = (idEstudiante, idEstado) => {
    return new Promise((resolve, reject) => {
      Estudiante.findByIdAndUpdate(idEstudiante, {
        estado: idEstado,
      })
        .then(async () => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  try {
    var cursoSeleccionado = await obtenerCurso();
    var estadoCursandoMateria = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Cursando"
    );
    var inscripcion = await obtenerInscripcion();
    var materiasDelCurso = await obtenerMateriasDeCurso(idCurso);
    let cuotasAnteriores = [];
    let contadorInasistenciasInjustificada = 0;
    let contadorInasistenciasJustificada = 0;
    let contadorLlegadasTarde = 0;

    //Si el estudiante tiene una inscripcion anteriormente, se obtienen las CXM que esten desaprobadas,
    //ya sea las que estan en materiasPendientes y las CXM con estado "Desaprobada"
    var materiasPendientesNuevas = [];
    if (inscripcion != null) {
      contadorInasistenciasInjustificada =
        inscripcion.contadorInasistenciasInjustificada;
      contadorInasistenciasJustificada =
        inscripcion.contadorInasistenciasJustificada;
      contadorLlegadasTarde = inscripcion.contadorLlegadasTarde;

      inscripcion.activa = false;

      var idEstadoDesaprobadaMateria = await ClaseEstado.obtenerIdEstado(
        "CalificacionesXMateria",
        "Desaprobada"
      );
      var idsCXMDesaprobadas = await ClaseCalifXMateria.obtenerMateriasDesaprobadasv2(
        inscripcion.materiasPendientes,
        inscripcion.calificacionesXMateria,
        idEstadoDesaprobadaMateria
      );
      if (idsCXMDesaprobadas.length != 0) {
        materiasPendientesNuevas.push(...idsCXMDesaprobadas);
      }
      await inscripcion.save();

      var idCicloLectivo = await ClaseEstado.obtenerIdCicloLectivo(false);

      esCambioDeCurso(inscripcion.idCurso, idCicloLectivo);
    }

    var cuotas = [];
    if (cuotasAnteriores.length == 0) {
      cuotas = await crearCuotas();
    } else {
      cuotas = cuotasAnteriores;
    }

    var idsCXMNuevas = await ClaseCalifXMateria.crearCXM(
      materiasDelCurso,
      estadoCursandoMateria._id
    );

    const nuevaInscripcion = new Inscripcion({
      idEstudiante: idEstudiante,
      idCurso: cursoSeleccionado._id,
      documentosEntregados: documentosEntregados,
      estado: idEstadoActiva,
      contadorInasistenciasInjustificada: contadorInasistenciasInjustificada,
      contadorInasistenciasJustificada: contadorInasistenciasJustificada,
      contadorLlegadasTarde: contadorLlegadasTarde,
      calificacionesXMateria: idsCXMNuevas,
      materiasPendientes: materiasPendientesNuevas,
      CicloLectivo: idCicloLectivo,
      cuotas: cuotas,
      sanciones: [],
    });

    await nuevaInscripcion.save();
    cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
    await cursoSeleccionado.save();
    let idEstadoInscriptoEstudiante = await ClaseEstado.obtenerIdEstado(
      "Estudiante",
      "Inscripto"
    );

    await actualizarEstadoEstudiante(idEstudiante, idEstadoInscriptoEstudiante);
    return true;
  } catch (error) {
    return false;
  }
};

exports.inscribirEstudianteProximoAnio = async function (
  idCurso,
  idEstudiante
) {
  let fechaActual = new Date();

  let obtenerCurso = (añoActual) => {
    return new Promise((resolve, reject) => {
      Curso.findOne({ _id: idCurso, añoLectivo: añoActual })
        .then((curso) => {
          resolve(curso);
        })
        .catch((err) => reject(err));
    });
  };

  try {
    var idEstadoPendienteInscripcion = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Pendiente"
    );

    var cursoSeleccionado = await obtenerCurso(fechaActual.getFullYear() + 1);

    const nuevaInscripcion = new Inscripcion({
      idEstudiante: idEstudiante,
      idCurso: cursoSeleccionado._id,
      estado: idEstadoPendienteInscripcion,
      contadorInasistenciasInjustificada: 0,
      contadorInasistenciasJustificada: 0,
      contadorLlegadasTarde: 0,
      año: fechaActual.getFullYear() + 1,
    });

    await nuevaInscripcion.save();
    cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
    await cursoSeleccionado.save();

    return true;
  } catch (error) {
    return false;
  }
};
