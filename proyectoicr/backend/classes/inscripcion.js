const mongoose = require("mongoose");
const Curso = require("../models/curso");
const Estado = require("../models/estado");
const Inscripcion = require("../models/inscripcion");
const Estudiante = require("../models/estudiante");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseEstado = require("../classes/estado");
const ClaseCalifXMateria = require("../classes/calificacionXMateria");

exports.obtenerAñoHabilitado = function (inscripcion) {
  let añoActual;
  let siguiente;
  añoActual = parseInt(inscripcion[0].cursoActual[0].nombre, 10);

  if (
    inscripcion[0].estadoInscripcion[0].nombre == "Promovido" ||
    inscripcion[0].estadoInscripcion[0].nombre ==
      "Promovido con examenes pendientes"
  ) {
    siguiente = añoActual + 1;
  } else {
    siguiente = añoActual;
  }

  return siguiente;
};

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

  let obtenerInscripcion = () => {
    return new Promise((resolve, reject) => {
      Inscripcion.findOne({
        idEstudiante: idEstudiante,
        activa: true, //#resolve ver si es necesario filtrar por estado
      })
        .then((inscripcion) => {
          resolve(inscripcion);
        })
        .catch((err) => reject(err));
    });
  };

  //Dada una id de curso, obtiene las ids de las materias que se dan en ese curso
  let obtenerMateriasDeCurso = (idCurso) => {
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
  };

  let crearCuotas = () => {
    cuotas = [];

    for (let i = 0; i < 12; i++) {
      let cuota = { mes: i + 1, pagado: false };
      cuotas.push(cuota);
    }
    return cuotas;
  };

  let obtenerAñoCicloLectivo = () => {
    let fechaActual = new Date();
    return new Promise((resolve, reject) => {
      CicloLectivo.findOne({ año: fechaActual.getFullYear() })
        .then((cicloLectivo) => {
          resolve(cicloLectivo.año);
        })
        .catch((err) => reject(err));
    });
  };

  let aumentarCupo = (idCurso) => {
    return new Promise((resolve, reject) => {
      Curso.findByIdAndUpdate(idCurso, { $inc: { capacidad: 1 } })
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
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
    var estadoInscriptoInscripcion = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Inscripto"
    );
    var estadoCursandoMateria = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Cursando"
    );
    var inscripcion = await obtenerInscripcion();
    var añoActual = await obtenerAñoCicloLectivo();
    var materiasDelCurso = await obtenerMateriasDeCurso(idCurso);
    let cuotasAnteriores = [];

    //Si el estudiante tiene una inscripcion anteriormente, se obtienen las CXM que esten desaprobadas,
    //ya sea las que estan en materiasPendientes y las CXM con estado "Desaprobada"
    var materiasPendientesNuevas = [];
    if (inscripcion != null) {
      inscripcion.activa = false;
      // cuotasAnteriores = inscripcion.cuotas;

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

      //Si es cambio de curso
      if (añoActual == inscripcion.año) {
        aumentarCupo(inscripcion.idCurso);
        cuotasAnteriores = inscripcion.cuotas;
      }
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
      activa: true,
      estado: estadoInscriptoInscripcion._id,
      contadorInasistenciasInjustificada: 0,
      contadorInasistenciasJustificada: 0,
      contadorLlegadasTarde: 0,
      calificacionesXMateria: idsCXMNuevas,
      materiasPendientes: materiasPendientesNuevas,
      año: añoActual,
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

exports.inscribirEstudianteProximoAño = async function (idCurso, idEstudiante) {
  let obtenerCurso = (añoActual) => {
    return new Promise((resolve, reject) => {
      Curso.findOne({ _id: idCurso, añoLectivo: añoActual })
        .then((curso) => {
          resolve(curso);
        })
        .catch((err) => reject(err));
    });
  };

  let obtenerAñoCicloLectivo = () => {
    let fechaActual = new Date();
    return new Promise((resolve, reject) => {
      CicloLectivo.findOne({ año: fechaActual.getFullYear() + 1 })
        .then((cicloLectivo) => {
          resolve(cicloLectivo.año);
        })
        .catch((err) => reject(err));
    });
  };

  try {
    var estadoPendienteInscripcion = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Pendiente"
    );

    var añoActual = await obtenerAñoCicloLectivo();
    var cursoSeleccionado = await obtenerCurso(añoActual);

    const nuevaInscripcion = new Inscripcion({
      idEstudiante: idEstudiante,
      idCurso: cursoSeleccionado._id,
      activa: false,
      estado: estadoPendienteInscripcion._id,
      contadorInasistenciasInjustificada: 0,
      contadorInasistenciasJustificada: 0,
      contadorLlegadasTarde: 0,
    });

    await nuevaInscripcion.save();
    cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
    await cursoSeleccionado.save();

    return true;
  } catch (error) {
    return false;
  }
};
