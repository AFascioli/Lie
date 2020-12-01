const Curso = require("../models/curso");
const CicloLectivo = require("../models/cicloLectivo");
const MateriaXCurso = require("../models/materiasXCurso");
const ClaseEstado = require("../classes/estado");
const ClaseCicloLectivo = require("../classes/cicloLectivo");

exports.clonarAgenda = async function (idCurso, yearSelected) {
  let idMateriasXCursoAñoAnterior = [];
  let idMateriasXCurso = [];

  let idCreada = await ClaseEstado.obtenerIdEstado("MateriasXCurso", "Creada");

  //obtener el ciclo lectivo para el año anterior

  let idCicloAnterior = await ClaseCicloLectivo.obtenerIdCicloAnterior();

  if (idCicloAnterior == null) {
    return false;
  }

  //obtener el curso actual xq necesitamos el nombre
  let cursoActual = await Curso.findById(idCurso).exec();
  cursoActual.materias = [];

  //obtenemos las materias del año anterior
  let obtenerMateriasCursoAnterior = () => {
    return new Promise(async (resolve, reject) => {
      Curso.findOne({
        cicloLectivo: idCicloAnterior,
        nombre: cursoActual.nombre,
      })
        .then(async (curso) => {
          resolve(curso.materias);
        })
        .catch((error) => resolve(error));
    });
  };

  //Creamos las nuevas CXM
  let crearMXCNuevas = (idMateriasXCursoAñoAnterior) => {
    return new Promise(async (resolve, reject) => {
      for (let idMXC in idMateriasXCursoAñoAnterior) {
        MXCVieja = await MateriaXCurso.findById(
          idMateriasXCursoAñoAnterior[idMXC]
        ).exec();
        let MXCNueva = new MateriaXCurso({
          horarios: MXCVieja.horarios,
          idMateria: MXCVieja.idMateria,
          idDocente: MXCVieja.idDocente,
          estado: idCreada,
        });
        MXCNueva.save().then((MXC) => idMateriasXCurso.push(MXC._id));
      }
      resolve(idMateriasXCurso);
    });
  };

  let guardarCursoActual = () => {
    return new Promise(async (resolve, reject) => {
      cursoActual
        .save()
        .then((curso) => {
          resolve(curso);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  idMateriasXCursoAñoAnterior = await obtenerMateriasCursoAnterior();
  cursoActual.materias = await crearMXCNuevas(idMateriasXCursoAñoAnterior);
  guardarCursoActual();

  return true;
};
