const mongoose = require("mongoose");

const imagenfilesSchema = mongoose.Schema({
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  filename: String,
  md5: String,
  contentType: String
});

module.exports = mongoose.model(
  "imagen.files",
  imagenfilesSchema,
  "imagen.files"
);
