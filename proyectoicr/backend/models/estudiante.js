const mongoose = require('mongoose');

const estudianteSchema = mongoose.Schema({
  apellido: {type: String, required: true},
    nombre: {type: String, required: true},
    tipoDocumento: {type: String, required: true},
    numeroDocumento: {type: Number, required: true},
    cuil: Number,
    sexo: {type: String, required: true},
    calle:{type: String, required: true},
    numeroCalle:{type: Number, required: true},
    piso: String,
    departamento: String,
    provincia: {type: String, required: true},
    localidad: {type: String, required: true},
    codigoPostal: Number,
    nacionalidad: String,
    provinciaNacimiento: String,
    localidadNacimiento:String,
    fechaNacimiento: {type: Date, required: true},
    estadoCivil: String,
    telefonoFijo: Number,
    adultoResponsable: String
});
module.exports= mongoose.model('estudiantes', estudianteSchema);
