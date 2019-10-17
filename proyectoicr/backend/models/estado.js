const mongoose = require('mongoose');

const estadoSchema = mongoose.Schema({
    nombre: {type: String, required: true},
    ambito: {type: String, required: true}
});

module.exports= mongoose.model('estado', estadoSchema, 'estado');
