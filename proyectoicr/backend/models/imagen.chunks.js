const mongoose = require("mongoose");

const imagenchunksSchema = mongoose.Schema({
  files_id: String,
  n: Number
});

module.exports = mongoose.model(
  "imagen.chunks",
  imagenchunksSchema,
  "imagen.chunks"
);
