const mongoose = require("mongoose");

const imagenchunksSchema = mongoose.Schema({
  files_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "imagen.files" }],
  n: Number
});

module.exports = mongoose.model(
  "imagen.chunks",
  imagenchunksSchema,
  "imagen.chunks"
);
