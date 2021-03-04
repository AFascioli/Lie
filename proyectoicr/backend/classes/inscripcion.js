const mongoose = require("mongoose");
const Curso = require("../models/curso");
const Inscripcion = require("../models/inscripcion");
const Estudiante = require("../models/estudiante");
const CicloLectivo = require("../models/cicloLectivo");
const CalificacionesXMateria = require("../models/calificacionesXMateria");
const ClaseEstado = require("../classes/estado");
const ClaseCicloLectivo = require("../classes/cicloLectivo");
const ClaseCalifXMateria = require("../classes/calificacionXMateria");

//Retorna numero de curso al que se puede inscribir el estudiante segun el ciclo seleccionado
exports.obtenerAñoHabilitado = function (inscripcion, idCicloSeleccionado) {
  return new Promise(async (resolve, reject) => {
    let siguiente;
    let añoActual = parseInt(inscripcion[0].cursoActual[0].nombre, 10);
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();

    if (idCicloSeleccionado != idCicloActual) {
      siguiente = añoActual + 1;
    } else {
      siguiente = añoActual;
    }

    resolve(siguiente);
  });
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
        $project: {
          "materiasDelCurso.idMateria": 1,
        },
      },
    ])
      .then((materiasDelCurso) => {
        let idsMateriasDelCurso = [];
        materiasDelCurso.forEach((objMateria) => {
          idsMateriasDelCurso.push(objMateria.materiasDelCurso[0].idMateria);
        });
        resolve(idsMateriasDelCurso);
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

    for (let i = 3; i <= 12; i++) {
      let cuota = { mes: i, pagado: false };
      cuotas.push(cuota);
    }
    return cuotas;
  };

  let actualizarEstadoEstudiante = (idEstudiante, idEstado) => {
    return new Promise((resolve, reject) => {
      Estudiante.findByIdAndUpdate(idEstudiante, {
        estado: idEstado,
      })
        .then(async () => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  try {
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
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
    var materiasPendientesNuevas = [];

    //Si es cambio de curso se deben copiar los siguientes datos de la inscripcion "vieja"
    if (inscripcion != null) {
      let idInscripcionInactiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Inactiva"
      );
      contadorInasistenciasInjustificada =
        inscripcion.contadorInasistenciasInjustificada;
      contadorInasistenciasJustificada =
        inscripcion.contadorInasistenciasJustificada;
      contadorLlegadasTarde = inscripcion.contadorLlegadasTarde;
      materiasPendientesNuevas.push(...inscripcion.materiasPendientes);
      cuotasAnteriores = inscripcion.cuotas;

      inscripcion.estado = idInscripcionInactiva;
      let idCursoASubir = inscripcion.idCurso;
      await inscripcion.save();

      // Sumar capacidad al curso de donde salio el estudiante
      await Curso.findByIdAndUpdate(idCursoASubir, {
        $inc: { capacidad: 1 },
      }).exec();
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
      cicloLectivo: idCicloActual,
      cuotas: cuotas,
      sanciones: inscripcion ? inscripcion.sanciones : [],
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
  let obtenerCurso = (idCicloLectivo) => {
    return new Promise((resolve, reject) => {
      Curso.findOne({ _id: idCurso, cicloLectivo: idCicloLectivo })
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

    let idCicloProximo = await ClaseCicloLectivo.obtenerIdCicloProximo();

    var cursoSeleccionado = await obtenerCurso(idCicloProximo);

    let inscripcionPendiente = await Inscripcion.findOne({
      idEstudiante: idEstudiante,
      estado: idEstadoPendienteInscripcion,
    });

    // Si era cambio de curso de la insc pendiente ponemos en inactiva la anterior
    if (inscripcionPendiente) {
      var idEstadoInactiva = await ClaseEstado.obtenerIdEstado(
        "Inscripcion",
        "Inactiva"
      );
      inscripcionPendiente.estado = idEstadoInactiva;
      await inscripcionPendiente.save();
    }

    let crearCuotas = () => {
      cuotas = [];

      for (let i = 3; i <= 12; i++) {
        let cuota = { mes: i, pagado: false };
        cuotas.push(cuota);
      }
      return cuotas;
    };
    let coutasCreadas = crearCuotas();
    let documentosEntregados = [
      {
        nombre: "Fotocopia documento",
        entregado: false,
      },
      {
        nombre: "Ficha médica",
        entregado: false,
      },
      {
        nombre: "Informe año anterior",
        entregado: false,
      },
    ];

    const nuevaInscripcion = new Inscripcion({
      idEstudiante: idEstudiante,
      idCurso: cursoSeleccionado._id,
      estado: idEstadoPendienteInscripcion,
      contadorInasistenciasInjustificada: 0,
      contadorInasistenciasJustificada: 0,
      contadorLlegadasTarde: 0,
      cicloLectivo: idCicloProximo,
      cuotas: coutasCreadas,
      documentosEntregados: documentosEntregados,
    });

    await nuevaInscripcion.save();
    cursoSeleccionado.capacidad = cursoSeleccionado.capacidad - 1;
    await cursoSeleccionado.save();

    return true;
  } catch (error) {
    return false;
  }
};

exports.actualizarEstadoInscripcion = (inscripcion) => {
  return new Promise(async (resolve, reject) => {
    let idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido"
    );
    let idEstadoExPendientes = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Examenes pendientes"
    );
    let idEstadoPendienteExamen = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Pendiente examen"
    );
    let promovido = true;

    for (const cxm of inscripcion.datosCXM) {
      if (
        cxm.estado
          .toString()
          .localeCompare(idEstadoPendienteExamen.toString()) == 0 ||
        inscripcion.materiasPendientes.length != 0
      ) {
        promovido = false;
        break;
      }
    }

    if (promovido) {
      await Inscripcion.findByIdAndUpdate(inscripcion._id, {
        estado: idEstadoPromovido,
      }).exec();
    } else {
      await Inscripcion.findByIdAndUpdate(inscripcion._id, {
        estado: idEstadoExPendientes,
      }).exec();
    }

    resolve();
  });
};

exports.cambiarEstadoExamPendientes = (idCicloActual) => {
  return new Promise(async (resolve, reject) => {
    const idEstadoExamPendientes = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Examenes pendientes"
    );
    const idEstadoPromovido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido"
    );
    const idEstadoPromovidoExamPendientes = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Promovido con examenes pendientes"
    );
    const idEstadoLibre = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Libre"
    );
    const idEstadoCXMPendiente = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Pendiente examen"
    );
    const idEstadoCXMDesaprobada = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Desaprobada"
    );
    const idEstadoPendiente = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Pendiente"
    );

    let inscripcionesPendientes = await Inscripcion.aggregate([
      {
        $match: {
          cicloLectivo: mongoose.Types.ObjectId(idCicloActual),
          estado: mongoose.Types.ObjectId(idEstadoExamPendientes),
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
    ]);

    for (const inscripcion of inscripcionesPendientes) {
      let idsCXMPendientes = [];
      for (const cxm of inscripcion.datosCXM) {
        if (
          cxm.estado
            .toString()
            .localeCompare(idEstadoCXMPendiente.toString()) == 0
        ) {
          idsCXMPendientes.push(cxm._id);
        }
      }

      if (idsCXMPendientes.length == 0) {
        await Inscripcion.findByIdAndUpdate(inscripcion._id, {
          estado: idEstadoPromovido,
        }).exec();
      } else if (idsCXMPendientes.length < 4) {
        for (const idCxm of idsCXMPendientes) {
          await CalificacionesXMateria.findByIdAndUpdate(idCxm, {
            estado: idEstadoCXMDesaprobada,
          }).exec();
        }
        await Inscripcion.findByIdAndUpdate(inscripcion._id, {
          estado: idEstadoPromovidoExamPendientes,
          materiasPendientes: idsCXMPendientes,
        }).exec();
      } else {
        for (const idCxm of idsCXMPendientes) {
          await CalificacionesXMateria.findByIdAndUpdate(idCxm, {
            estado: idEstadoCXMDesaprobada,
          }).exec();
        }
        await Inscripcion.findByIdAndUpdate(inscripcion._id, {
          estado: idEstadoLibre,
        }).exec();
        //Se borra la inscripcion pendiente ya que el estudiante quedo libre
        await Inscripcion.findOneAndDelete({
          idEstudiante: inscripcion.idEstudiante,
          estado: idEstadoPendiente,
        }).exec();
      }
    }
    resolve();
  });
};
