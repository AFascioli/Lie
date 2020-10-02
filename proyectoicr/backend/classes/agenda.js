const Curso = require("../models/curso");
const CicloLectivo = require("../models/cicloLectivo");
const MateriaXCurso = require("../models/materiasXCurso");
const ClaseEstado = require("../classes/estado");

exports.clonarAgenda = async function (idCurso, yearSelected) {
  let idMateriasXCurso = [];
  let nombreCurso;

  //obtener el id del estado creada para mat.XCurso
  let idCreada = await ClaseEstado.obtenerIdEstado("MateriasXCurso", "Creada");

  //obtener el ciclo lectivo para el año anterior
  let cicloLectivoAnterior = await CicloLectivo.findOne({
    año: yearSelected - 1,
  }).exec();

  //obtener el curso actual xq necesitamos el nombre
  let cursoActual = await Curso.findById(idCurso).exec();

  //obtener las materias de curso anterior
  Curso.findOne({
    cicloLectivo: cicloLectivoAnterior,
    nombre: cursoActual.nombre,
  }).then(async (curso) => {
    idMateriasXCurso = await curso.materias;
    //pegar materias al curso pasado por parametro
    cursoActual.materias = idMateriasXCurso;
    cursoActual.save().exec();
  });

  //setear ese estado en todas las materias
  for (let idMXC in idMateriasXCurso) {
    MateriaXCurso.findByIdAndUpdate(idMXC, { estado: idCreada }).exec();
  }
};
