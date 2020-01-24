const mongoose = require('mongoose');

const administradorSchema = mongoose.Schema({
    apellido: {type: String, required: true},
    nombre: {type: String, required: true},
    tipoDocumento: {type: String, required: true},
    numeroDocumento: {type: Number, required: true},
    sexo: {type: String, required: true},
    nacionalidad: String,
    fechaNacimiento: {type: Date, required: true},
    telefono: Number,
    email: String,
    idUsuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuario" }
});

module.exports= mongoose.model('administrador', administradorSchema, 'administrador');
