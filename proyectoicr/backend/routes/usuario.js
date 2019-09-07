const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/usuario");

const router = express.Router();

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    const usuario = new Usuario({
      email: req.body.email,
      password: hash
    });
    usuario
      .save()
      .then(result => {
        res.status(201).json({
          message: "Usuario creado exitósamente",
          exito: true
        });
      })
      .catch(err => {
        res.status(200).json({
          exito: false
        });
      });
  });
});

router.post("/login",(req, res, next) => {
  let usuarioEncontrado;
  Usuario.findOne({ email: req.body.email })
    .then(usuario => {
      if (!usuario) {
        return res.status(200).json({
          message: "Autenticación fallida",
          exito: false
        });
      }
      usuarioEncontrado = usuario;
      return bcrypt.compare(req.body.password, usuario.password);
    })
    .then(resultado => {
      if (!resultado) {
        return res.status(200).json({
          message: "Autenticación fallida",
          exito: false
        });
      }
      const token = jwt.sign(
        { email: usuarioEncontrado.email, userId: usuarioEncontrado._id },
        "aca_va_el_secreto_que_es_una_string_larga",
        { expiresIn: "12h" }
      );
      res.status(200).json({
        token: token,
        duracionToken: 43200
      });
    })
    .catch(err => {
      return res.status(200).json({
        message: "Autenticación fallida",
        exito: false
      });
    });
});

module.exports = router;
