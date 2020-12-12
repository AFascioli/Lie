const mongoose = require("mongoose");
const Curso = require("../models/curso");
const Inscripcion = require("../models/inscripcion");
const ClaseEstado = require("../classes/estado");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseInscripcion = require("../classes/inscripcion");
const ClaseCicloLectivo = require("../classes/cicloLectivo");

//Retorna un array con los cursos que no tienen agenda
exports.cursosTienenAgenda = async () => {
  let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
  return new Promise((resolve, reject) => {
    Curso.find({ cicloLectivo: idCicloActual }).then((cursosActuales) => {
      let cursosSinAgenda = [];
      cursosActuales.map((curso) => {
        if (curso.materias.length == 0) {
          cursosSinAgenda.push({ _id: curso._id, nombre: curso.nombre });
        }
      });
      resolve(cursosSinAgenda);
    });
  });
};

// Se obtienen las inscripciones pendientes del ciclo actual, a estas se les cambia el estado a activa
// se les copian las materias pendientes de la inscripcion del año anterior y se les asignan las CXM correspondientes.
exports.pasarInscripcionesAActivas = () => {
  return new Promise(async (resolve, reject) => {
    let idPendiente = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Pendiente"
    );
    let idActiva = await ClaseEstado.obtenerIdEstado("Inscripcion", "Activa");
    let idInactiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Inactiva"
    );
    let idCursandoCXM = await ClaseEstado.obtenerIdEstado(
      "CalificacionesXMateria",
      "Cursando"
    );

    let idCicloActual = await this.obtenerIdCicloActual();
    let idCicloAnterior = await this.obtenerIdCicloAnterior();

    Inscripcion.find({ estado: idPendiente, cicloLectivo: idCicloActual }).then(
      async (inscripcionesPendientes) => {
        for (const inscripcion of inscripcionesPendientes) {
          let materiasDelCurso = await ClaseInscripcion.obtenerMateriasDeCurso(
            inscripcion.idCurso
          );
          let idsCXM = await ClaseCXM.crearCXM(materiasDelCurso, idCursandoCXM);

          // Obtenemos la inscripcion del año anterior (filtrada por estudiante, estado que no sea inactiva y ciclo)
          let inscripcionAnterior = await Inscripcion.findOne({
            idEstudiante: inscripcion.idEstudiante,
            estado: {
              $ne: mongoose.Types.ObjectId(idInactiva),
            },
            cicloLectivo: idCicloAnterior,
          });

          inscripcion.calificacionesXMateria = idsCXM;
          inscripcion.materiasPendientes = inscripcionAnterior
            ? inscripcionAnterior[0].materiasPendientes
            : [];
          inscripcion.estado = idActiva;
          inscripcion.save();
          resolve();
        }
      }
    );
  });
};

exports.crearCursosParaCiclo = (idCicloProximo) => {
  CicloLectivo.findById(idCicloProximo).then((cicloLectivo) => {
    let nombresCursos = [
      "1A",
      "2A",
      "3A",
      "4A",
      "5A",
      "6A",
      "1B",
      "2B",
      "3B",
      "4B",
      "5B",
      "6B",
    ];

    nombresCursos.forEach((nombreCurso) => {
      let nuevoCurso = new Curso({
        nombre: nombreCurso,
        materias: [],
        capacidad: 30,
        cicloLectivo: cicloLectivo._id,
      });
      nuevoCurso.save();
    });
  });
};

exports.obtenerCantidadFaltasSuspension = async () => {
  let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
  return new Promise((resolve, reject) => {
    CicloLectivo.findById(idCicloActual)
      .then((cicloLectivo) => {
        resolve(cicloLectivo.cantidadFaltasSuspension);
      })
      .catch((err) => reject(err));
  });
};

// #deprecado
// exports.obtenerIdCicloLectivo = (proximo) => {
//   let fechaActual = new Date();
//   let año = proximo ? fechaActual.getFullYear() + 1 : fechaActual.getFullYear();
//   return new Promise((resolve, reject) => {
//     CicloLectivo.findOne({ año: año })
//       .then((cicloLectivo) => {
//         resolve(cicloLectivo._id);
//       })
//       .catch((err) => reject(err));
//   });
// };

exports.obtenerIdsCursos = async () => {
  let idCicloActual = await this.obtenerIdCicloActual();
  let idsCursosActuales = [];
  let cursos = await Curso.find({ cicloLectivo: idCicloActual });
  cursos.forEach((curso) => {
    idsCursosActuales.push(curso._id);
  });
  return idsCursosActuales;
};

//Retorna un array con las materias y su curso correspondiente que aun no estan cerradas. Si estan todas cerradas,
//se retorna un array vacio. Discrimina segun trimestre.
exports.materiasSinCerrar = (trimestre) => {
  return new Promise(async (resolve, reject) => {
    let idCicloActual = await this.obtenerIdCicloActual();
    let idsCursosActuales = await this.obtenerIdsCursos();
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );
    let inscripciones = [];

    for (const idCurso of idsCursosActuales) {
      let inscripcion = await Inscripcion.findOne({
        idCurso: idCurso,
        cicloLectivo: idCicloActual,
        estado: {
          $in: [
            mongoose.Types.ObjectId(idEstadoActiva),
            mongoose.Types.ObjectId(idEstadoSuspendido),
          ],
        },
      });
      inscripciones.push(inscripcion._id);
    }
    let materiasNoCerrada = [];
    let inscripcionesFiltradas = [];
    if (trimestre == 3) {
      inscripcionesFiltradas = await Inscripcion.aggregate([
        {
          $match: {
            _id: { $in: inscripciones },
          },
        },
        {
          $unwind: {
            path: "$calificacionesXMateria",
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
          $lookup: {
            from: "estado",
            localField: "datosCXM.estado",
            foreignField: "_id",
            as: "datosEstadoCXM",
          },
        },
        {
          $match: {
            "datosEstadoCXM.nombre": "Cursando",
          },
        },
        {
          $lookup: {
            from: "curso",
            localField: "idCurso",
            foreignField: "_id",
            as: "datosCurso",
          },
        },
        {
          $lookup: {
            from: "materia",
            localField: "datosCXM.idMateria",
            foreignField: "_id",
            as: "datosMateria",
          },
        },
      ]);
    } else {
      let idEstadoEnTrimestre;
      if (trimestre == 1) {
        idEstadoEnTrimestre = await ClaseEstado.obtenerIdEstado(
          "MateriasXCurso",
          "En primer trimestre"
        );
      } else {
        idEstadoEnTrimestre = await ClaseEstado.obtenerIdEstado(
          "MateriasXCurso",
          "En segundo trimestre"
        );
      }
      inscripcionesFiltradas = await Inscripcion.aggregate([
        {
          $match: {
            _id: {
              $in: [inscripciones],
            },
          },
        },
        {
          $lookup: {
            from: "curso",
            localField: "idCurso",
            foreignField: "_id",
            as: "datosCurso",
          },
        },
        {
          $unwind: {
            path: "$datosCurso",
          },
        },
        {
          $unwind: {
            path: "$datosCurso.materias",
          },
        },
        {
          $lookup: {
            from: "materiasXCurso",
            localField: "datosCurso.materias",
            foreignField: "_id",
            as: "datosMXC",
          },
        },
        {
          $match: {
            "datosMXC.estado": mongoose.Types.ObjectId(idEstadoEnTrimestre),
          },
        },
        {
          $lookup: {
            from: "materia",
            localField: "datosMXC.idMateria",
            foreignField: "_id",
            as: "datosMateria",
          },
        },
      ]);
    }

    if (inscripcionesFiltradas.length == 0) {
      resolve([]);
    } else {
      for (const inscripcion of inscripcionesFiltradas) {
        materiasNoCerrada.push({
          curso: inscripcion.datosCurso[0].nombre,
          materia: inscripcion.datosMateria[0].nombre,
        });
      }
      resolve(materiasNoCerrada);
    }
  });
};

//Actualiza el estado de las inscripciones del ciclo actual segun sean promovidas o con examenes pendientes
exports.actualizarEstadoInscripciones = () => {
  return new Promise(async (resolve, reject) => {
    let idCicloActual = await this.obtenerIdCicloActual();
    let idEstadoActiva = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Activa"
    );
    let idEstadoSuspendido = await ClaseEstado.obtenerIdEstado(
      "Inscripcion",
      "Suspendido"
    );

    let todasInscripciones = await Inscripcion.aggregate([
      {
        $match: {
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
    ]);

    for (const inscripcion of todasInscripciones) {
      await ClaseInscripcion.actualizarEstadoInscripcion(inscripcion);
    }
    resolve();
  });
};

exports.obtenerIdCicloProximo = () => {
  return new Promise(async (resolve, reject) => {
    let idCicloCreado = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "Creado"
    );
    let cicloLectivo = await CicloLectivo.findOne({ estado: idCicloCreado });
    resolve(cicloLectivo._id);
  });
};

exports.obtenerIdCicloActual = () => {
  return new Promise(async (resolve, reject) => {
    let idPrimerTrimestre = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "En primer trimestre"
    );
    let idSegundoTrimestre = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "En segundo trimestre"
    );
    let idTercerTrimestre = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "En tercer trimestre"
    );
    let idEnExamenes = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "En examenes"
    );
    let idFinExamenes = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "Fin examenes"
    );
    let cicloLectivo = await CicloLectivo.findOne({
      estado: {
        $in: [
          idPrimerTrimestre,
          idSegundoTrimestre,
          idTercerTrimestre,
          idEnExamenes,
          idFinExamenes,
        ],
      },
    });
    resolve(cicloLectivo._id);
  });
};

exports.obtenerIdCicloAnterior = () => {
  return new Promise(async (resolve, reject) => {
    let cicloLectivoActual = await CicloLectivo.findById(
      await this.obtenerIdCicloActual()
    );
    let cicloAnterior = await CicloLectivo.findOne({
      año: cicloLectivoActual.año - 1,
    });
    resolve(cicloAnterior ? cicloAnterior._id : null);
  });
};

exports.obtenerIdCicloSegunAño = (añoSeleccionado) => {
  return new Promise(async (resolve, reject) => {
    let cicloLectivo = await CicloLectivo.findOne({ año: añoSeleccionado });
    resolve(cicloLectivo ? cicloLectivo._id : null);
  });
};
