const Estudiante = require("../models/estudiante");
const Inscripcion = require("../models/inscripcion");
const Curso = require("../models/curso");

exports.CrearEstudiante = async function(
  apellido,
  nombre,
  tipoDocumento,
  numeroDocumento,
  cuil,
  sexo,
  calle,
  numeroCalle,
  piso,
  departamento,
  provincia,
  localidad,
  codigoPostal,
  nacionalidad,
  fechaNacimiento,
  estadoCivil,
  telefonoFijo,
  adultoResponsable,
  activo,
  estado
) {
  const estudiante = new Estudiante({
    apellido: apellido,
    nombre: nombre,
    tipoDocumento: tipoDocumento,
    numeroDocumento: numeroDocumento,
    cuil: cuil,
    sexo: sexo,
    calle: calle,
    numeroCalle: numeroCalle,
    piso: piso,
    departamento: departamento,
    provincia: provincia,
    localidad: localidad,
    codigoPostal: codigoPostal,
    nacionalidad: nacionalidad,
    fechaNacimiento: fechaNacimiento,
    estadoCivil: estadoCivil,
    telefonoFijo: telefonoFijo,
    adultoResponsable: adultoResponsable,
    activo: activo,
    estado: estado._id
  });
  return estudiante;
};
