const mongoose = require("mongoose");
const Curso = require("../models/curso");
const Inscripcion = require("../models/inscripcion");
const ClaseEstado = require("../classes/estado");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseCXM = require("../classes/calificacionXMateria");
const ClaseInscripcion = require("../classes/inscripcion");

//Retorna un array con los cursos que no tienen agenda
exports.cursosTienenAgenda = () => {
  let añoActual = new Date().getFullYear();
  return new Promise((resolve, reject) => {
    Curso.aggregate([
      {
        $lookup: {
          from: "cicloLectivo",
          localField: "cicloLectivo",
          foreignField: "_id",
          as: "datosCicloLectivo",
        },
      },
      {
        $match: {
          "datosCicloLectivo.año": añoActual,
        },
      },
    ])
      .then((cursosActuales) => {
        let cursosSinAgenda = [];
        cursosActuales.map((curso) => {
          if (curso.materias.length == 0) {
            cursosSinAgenda.push({ _id: curso._id, nombre: curso.nombre });
          }
        });
        resolve(cursosSinAgenda);
      })
      .catch((error) => {
        reject(null);
      });
  });
};

// Se obtienen las inscripciones pendientes del ciclo actual, a estas se les cambia el estado a activa
// se les copian las materias pendientes de la inscripcion del año anterior y se les asignan las CXM correspondientes.
exports.pasarInscripcionesAActivas = () => {
  let añoActual = new Date().getFullYear();
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

    Inscripcion.aggregate([
      {
        $match: {
          estado: mongoose.Types.ObjectId(idPendiente),
        },
      },
      {
        $lookup: {
          from: "cicloLectivo",
          localField: "cicloLectivo",
          foreignField: "_id",
          as: "datosCiclo",
        },
      },
      {
        $match: {
          "datosCiclo.año": añoActual,
        },
      },
    ]).then(async (inscripcionesPendientes) => {
      for (const inscripcionJson of inscripcionesPendientes) {
        let inscripcion = await Inscripcion.findById(inscripcionJson._id);

        let materiasDelCurso = await ClaseInscripcion.obtenerMateriasDeCurso(
          inscripcion.idCurso
        );
        let idsCXM = await ClaseCXM.crearCXM(materiasDelCurso, idCursandoCXM);

        // Obtenemos la inscripcion del año anterior (filtrada por estudiante, estado que no sea inactiva y ciclo)
        let inscripcionAnterior = await Inscripcion.aggregate([
          {
            $match: {
              idEstudiante: mongoose.Types.ObjectId(inscripcion.idEstudiante),
              estado: {
                $ne: mongoose.Types.ObjectId(idInactiva),
              },
            },
          },
          {
            $lookup: {
              from: "cicloLectivo",
              localField: "cicloLectivo",
              foreignField: "_id",
              as: "datosCiclo",
            },
          },
          {
            $match: {
              "datosCiclo.año": añoActual - 1,
            },
          },
        ]);
        inscripcion.calificacionesXMateria = idsCXM;
        inscripcion.materiasPendientes =
          inscripcionAnterior.length != 0
            ? inscripcionAnterior.materiasPendientes
            : [];
        inscripcion.estado = idActiva;
        inscripcion.save();
        resolve();
      }
    });
  });
};

exports.crearCursosParaCiclo = () => {
  let añoActual = new Date().getFullYear();
  console.log("Creando cursos para el ciclo");
  CicloLectivo.findOne({ año: añoActual })
    .then((cicloLectivo) => {
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
    })
    .catch((error) => {
      console.log(
        "Ocurrio un error creando los cursos para el nuevo ciclo lectivo " +
          error.message
      );
    });
};

exports.obtenerCantidadFaltasSuspension = () => {
  let fechaActual = new Date();
  return new Promise((resolve, reject) => {
    CicloLectivo.findOne({ año: fechaActual.getFullYear() })
      .then((cicloLectivo) => {
        resolve(cicloLectivo.cantidadFaltasSuspension);
      })
      .catch((err) => reject(err));
  });
};

//Retorna la id del ciclo lectivo segun si se quiere el actual (false) o el siguiente (true)
exports.obtenerIdCicloLectivo = (proximo) => {
  let fechaActual = new Date();
  let año = proximo ? fechaActual.getFullYear() + 1 : fechaActual.getFullYear();
  return new Promise((resolve, reject) => {
    CicloLectivo.findOne({ año: año })
      .then((cicloLectivo) => {
        resolve(cicloLectivo._id);
      })
      .catch((err) => reject(err));
  });
};
