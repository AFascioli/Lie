const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");
const Rol = require("../models/rol");
const Empleado = require("../models/empleado");
const Suscripcion = require("../classes/suscripcion");
const router = express.Router();

//Compara la contraseña ingresada por el usuario con la contraseña pasada por parametro
//si coinciden entonces le permite cambiar la contraseña, sino se lo deniega
router.post("/cambiarPassword", async (req, res) => {
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

//Genera el token y registra el rol que ingreso sesion
router.post("/login", (req, res) => {
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
          {
            email: usuarioEncontrado.email,
            userId: usuarioEncontrado._id,
            rol: usuarioEncontrado.rol
          },
          "aca_va_el_secreto_que_es_una_string_larga",
          { expiresIn: "12h" }
        );
        Rol.findById(usuarioEncontrado.rol).then(rol => {
          let idPersona = "";
          if (rol.tipo == "Docente") {
            Empleado.findOne({ idUsuario: usuarioEncontrado._id }).then(
              async empleado => {
                idPersona = empleado._id;
                await res.status(200).json({
                  token: token,
                  duracionToken: 43200,
                  rol: rol.tipo,
                  idPersona: idPersona,
                  message: "Bienvenido a Lié",
                  exito: true
                });
              }
            );
          } else {
            res.status(200).json({
              token: token,
              duracionToken: 43200,
              rol: rol.tipo,
              idPersona: idPersona,
              message: "Bienvenido a Lié",
              exito: true
            });
          }
        });
      }
    }
  });
});

//Envía una notificación de prueba a un email que se envia por parametro
//@params: email del usuario
router.get("/notificacion", (req, res) => {
  Usuario.findOne({ email: req.query.email }).then(usuario => {
    console.log("Envio de notificación a " + usuario.email);
    Suscripcion.notificar(
      usuario._id,
      "Titulo de la notificación de prueba",
      "Cuerpo de la notificación de prueba"
    );
    res.status(200).json({ message: "Prueba de notificación" });
  });
});

//Obtiene todos los permisos del rol que se envía por parámetro
//En el caso de que el permiso para la funcionalidad sea:
//2: tiene permiso de lectura y edición
//1: tiene permiso de lectura
//0: no posee permisos
router.get("/permisosDeRol", (req, res) => {
  Rol.aggregate([
    {
      $match: {
        tipo: req.query.rol
      }
    },
    {
      $lookup: {
        from: "permiso",
        localField: "permisos",
        foreignField: "_id",
        as: "permisosRol"
      }
    },
    {
      $project: {
        _id: 0,
        tipo: 0,
        permisos: 0
      }
    }
  ]).then(permisos => {
    return res.status(200).json({
      message: "Se obtuvo los permisos del rol exitosamente",
      exito: true,
      permisos: permisos[0].permisosRol[0]
    });
  });
});

//Registra a un usuario con el rol, contraseña e email
//@params: email del usuario
//@params: contraseña del usuario
router.post("/signup", (req, res) => {
  Usuario.findOne({ email: req.body.email }).then(usuario => {
    if (usuario) {
      return res.status(200).json({
        message: "Ya existe un usuario con el email ingresado",
        exito: false
      });
    } else {
      Rol.findOne({ tipo: req.body.rol }).then(rol => {
        bcrypt.hash(req.body.password, 10).then(hash => {
          const usuario = new Usuario({
            email: req.body.email,
            password: hash,
            rol: rol._id
          });
          usuario
            .save()
            .then(() => {
              res.status(201).json({
                message: "Usuario creado exitosamente",
                exito: true,
                id: usuario._id
              });
            })
            .catch(err => {
              res.status(200).json({
                message: "Ocurrieron mensajes al querer salir de la página"+ err,
                exito: false
              });
            });
        });
      });
    }
  });
});

//El usuario habilita la suscripcion para poder recibir las notificaciones
router.post("/suscripcion", (req, res) => {
  Usuario.findOneAndUpdate(
    { email: req.body.email },
    { $push: { suscripciones: req.body.sub } }
  )
    .then(usuario => {
      usuario.save().then(() => {
        console.log("Suscripción guardada correctamente.");
        res
          .status(201)
          .json({ message: "Suscripción registrada correctamente", exito: true });
      });
    })
    .catch(e => {
      res
      .status(200)
      .json({ message: "Ocurrieron errores al querer registrar la suscripcion" +err , exito: false});
    });

module.exports = router;
