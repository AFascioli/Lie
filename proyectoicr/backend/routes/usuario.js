const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/usuario");
const Rol= require("../models/rol");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    // Se crea el rol segun lo enviado desde el frontend (falta ver que onda con permisos)
    let idRolCreado="";
    const rol= new Rol({
      tipo= req.body.rol,
      permisos=""
    });
    // Se guarda la id del rol creado para asignarsela al usuario
    await rol.save().then(rolCreado=>{
      idRolCreado=rolCreado._id;
    });
    const usuario = new Usuario({
      email: req.body.email,
      password: hash,
      rol: idRolCreado
    });
    usuario
      .save()
      .then(result => {
        res.status(201).json({
          message: "Usuario creado exitosamente",
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

router.post("/login", (req, res, next) => {
  let usuarioEncontrado;
  Usuario.findOne({ email: req.body.email }).then(usuario => {
    if (!usuario) {
      return res.status(200).json({
        message: "El usuario ingresado no existe",
        exito: false
      });
    } else {
      usuarioEncontrado = usuario;
      if (!bcrypt.compareSync(req.body.password, usuario.password)) {
        return res.status(200).json({
          message: "La contraseña ingresada es incorrecta",
          exito: false
        });
      } else {
        const token = jwt.sign(
          { email: usuarioEncontrado.email, userId: usuarioEncontrado._id },
          "aca_va_el_secreto_que_es_una_string_larga",
          { expiresIn: "12h" }
        );
        res.status(200).json({
          token: token,
          duracionToken: 43200,
          message: "Bienvenido a Lié",
          exito: true
        });
      }
    }
  });
});

router.post("/cambiarPassword", async(req, res, next) => {
  let passwordNueva;
  await bcrypt.hash(req.body.passwordNueva, 10).then(hash => {
    passwordNueva = hash;
  });
  Usuario.findOne({ email: req.body.usuario }).then(usuario => {
    if (!bcrypt.compareSync(req.body.passwordVieja, usuario.password)) {
      return res.status(200).json({
        message: "La contraseña ingresada no coincide con la actual",
        exito: false
      });
    } else {
      Usuario.findOneAndUpdate(
        { email: req.body.usuario },
        { password: passwordNueva }
      ).exec();
      return res
        .status(200)
        .json({ message: "Contraseña cambiada correctamente", exito: true });
    }
  });
});

// router.post("/login",(req, res, next) => {
//   let usuarioEncontrado;
//   Usuario.findOne({ email: req.body.email })
//     .then(usuario => {
//       if (!usuario) {
//         return res.status(200).json({
//           message: "El usuario ingresado no existe",
//           exito: false
//         });
//       }
//       usuarioEncontrado = usuario;
//       return bcrypt.compare(req.body.password, usuario.password);
//     })
//     .then(resultado => {
//       if (!resultado) {
//         return res.status(200).json({
//           message: "La contraseña ingresada es incorrecta",
//           exito: false
//         });
//       }
//       const token = jwt.sign(
//         { email: usuarioEncontrado.email, userId: usuarioEncontrado._id },
//         "aca_va_el_secreto_que_es_una_string_larga",
//         { expiresIn: "12h" }
//       );
//       res.status(200).json({
//         token: token,
//         duracionToken: 43200,
//         message: "Autenticación exitosa",
//         exito: true
//       });
//     })
//     // .catch(err => {
//     //   return res.status(200).json({
//     //     message: "Autenticación fallida",
//     //     exito: false
//     //   });
//     // });
// });

module.exports = router;
