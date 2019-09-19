const mongoose = require('mongoose');

const adultoResponsableSchema = mongoose.Schema({
    apellido: {type: String, required: true},
    nombre: {type: String, required: true},
    tipoDocumento: {type: String, required: true},
    numeroDocumento: {type: Number, required: true},
    sexo: {type: String, required: true},
    nacionalidad: String,
    fechaNacimiento: {type: Date, required: true},
    telefono: Number,
    tutor: Boolean,
    idUsuario: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios" }
});
module.exports= mongoose.model('adultoResponsable', adultoResponsableSchema, 'adultoResponsable');
