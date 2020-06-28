const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");
const Rol = require("../models/rol");
const Empleado = require("../models/empleado");
const Suscripcion = require("../classes/suscripcion");
const router = express.Router();
const Keys = require("../assets/keys");
const mongoose = require("mongoose");

//Compara la contraseña ingresada por el usuario con la contraseña pasada por parametro
//si coinciden entonces le permite cambiar la contraseña, sino se lo deniega
router.post("/cambiarPassword", async (req, res) => {
  let passwordNueva;
  await bcrypt
    .hash(req.body.passwordNueva, 10)
    .then((hash) => {
      passwordNueva = hash;
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
  Usuario.findOne({ email: req.body.usuario })
    .then((usuario) => {
      if (!bcrypt.compareSync(req.body.passwordVieja, usuario.password)) {
        return res.status(200).json({
          message: "La contraseña ingresada no coincide con la actual",
          exito: false,
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
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Genera el token y registra el rol que ingreso sesion
router.post("/login", (req, res) => {
  let usuarioEncontrado;
  Usuario.findOne({ email: req.body.email })
    .then((usuario) => {
      if (!usuario) {
        return res.status(200).json({
          message: "El usuario ingresado no existe",
          exito: false,
        });
      } else {
        usuarioEncontrado = usuario;
        if (!bcrypt.compareSync(req.body.password, usuario.password)) {
          return res.status(200).json({
            message: "La contraseña ingresada es incorrecta",
            exito: false,
          });
        } else {
          const token = jwt.sign(
            {
              email: usuarioEncontrado.email,
              userId: usuarioEncontrado._id,
              rol: usuarioEncontrado.rol,
            },
            Keys.token_key,
            { expiresIn: "12h" }
          );
          Rol.findById(usuarioEncontrado.rol)
            .then((rol) => {
              let idPersona = "";
              if (rol.tipo == "Docente") {
                Empleado.findOne({ idUsuario: usuarioEncontrado._id })
                  .then(async (empleado) => {
                    idPersona = empleado.idUsuario;
                    await res.status(200).json({
                      token: token,
                      duracionToken: 43200,
                      rol: rol.tipo,
                      idPersona: idPersona,
                      exito: true,
                    });
                  })
                  .catch(() => {
                    res.status(500).json({
                      message: "El docente no esta registrado",
                      exito: false,
                    });
                  });
              } else {
                res.status(200).json({
                  token: token,
                  duracionToken: 43200,
                  rol: rol.tipo,
                  idPersona: usuarioEncontrado._id,
                  exito: true,
                });
              }
            })
            .catch(() => {
              res.status(500).json({
                message: "El rol asignado al usuario no existe",
                exito: false,
              });
            });
        }
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "No hay un usuario registrado con este mail",
        exito: false,
      });
    });
});

//Envía una notificación de prueba a un email que se envia por parametro
//@params: email del usuario
router.get("/notificacion", (req, res) => {
  Usuario.findOne({ email: req.query.email })
    .then((usuario) => {
      Suscripcion.notificacionIndividual(
        usuario._id,
        "Titulo de la notificación de prueba",
        "Cuerpo de la notificación de prueba"
      );
      res.status(200).json({ message: "Prueba de notificación" });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
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
        tipo: req.query.rol,
      },
    },
    {
      $lookup: {
        from: "permiso",
        localField: "permisos",
        foreignField: "_id",
        as: "permisosRol",
      },
    },
    {
      $project: {
        _id: 0,
        tipo: 0,
        permisos: 0,
      },
    },
  ])
    .then((permisos) => {
      return res.status(200).json({
        message: "Se obtuvo los permisos del rol exitosamente",
        exito: true,
        permisos: permisos[0].permisosRol[0],
      });
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Registra a un usuario con el rol, contraseña e email
//@params: email del usuario
//@params: contraseña del usuario
router.post("/signup", (req, res) => {
  Usuario.findOne({ email: req.body.email })
    .then((usuario) => {
      if (usuario) {
        return res.status(200).json({
          message: "Ya existe un usuario con el email ingresado",
          exito: false,
        });
      } else {
        Rol.findOne({ tipo: req.body.rol })
          .then((rol) => {
            bcrypt
              .hash(req.body.password, 10)
              .then((hash) => {
                const usuario = new Usuario({
                  email: req.body.email,
                  password: hash,
                  rol: rol._id,
                });
                usuario
                  .save()
                  .then(() => {
                    res.status(201).json({
                      message: "Usuario creado exitosamente",
                      exito: true,
                      id: usuario._id,
                    });
                  })
                  .catch((err) => {
                    res.status(200).json({
                      message:
                        "Ocurrieron mensajes al querer salir de la página" +
                        err,
                      exito: false,
                    });
                  });
              })
              .catch(() => {
                res.status(500).json({
                  message: "Mensaje de error especifico",
                });
              });
          })
          .catch(() => {
            res.status(500).json({
              message: "Mensaje de error especifico",
            });
          });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//El usuario habilita la suscripcion para poder recibir las notificaciones
router.post("/suscripcion", (req, res) => {
  Usuario.findOneAndUpdate(
    { email: req.body.email },
    { $push: { suscripciones: req.body.sub } }
  )
    .then((usuario) => {
      usuario.save().then(() => {
        res.status(201).json({
          message: "Suscripción registrada correctamente",
          exito: true,
        });
      });
    })
    .catch((e) => {
      res.status(200).json({
        message: "Ocurrieron errores al querer registrar la suscripcion" + err,
        exito: false,
      });
    });
});

router.get("/obtenerNombreApellido", (req, res) => {
  if (req.query.rol != "AdultorResponsable") {
    Empleado.aggregate([
      {
        $match: {
          idUsuario: mongoose.Types.ObjectId(req.query.idUsuario),
        },
      },
      {
        $project: {
          nombre: 1,
          apellido: 1,
        },
      },
    ])
      .then((usuario) => {
        return res.status(200).json({
          message: "Se obtuvo el empleado exitosamente",
          exito: true,
          usuario: usuario[0],
        });
      })
      .catch(() => {
        res.status(500).json({
          message: "Mensaje de error especifico",
        });
      });
  }
});

//Registra a un nuevo usuario Admin
//@params: email del usuario
//@params: contraseña del usuario
router.post("/signup/admin", async (req, res) => {
  try {
    const usuarioExiste = await Usuario.findOne({ email: req.body.email });
    if (usuarioExiste) {
      return res.status(200).json({
        message: "Ya existe un usuario con el email ingresado",
        exito: false,
      });
    }
    const rol = await Rol.findOne({ tipo: "Admin" });
    const hashPass = await bcrypt.hash(req.body.password, 10);
    const usuario = new Usuario({
      email: req.body.email,
      password: hashPass,
      rol: rol._id,
    });
    await usuario.save();

    return res.status(201).json({
      message: "Usuario creado exitosamente",
      exito: true,
      id: usuario._id,
    });
  } catch (error) {
    res.status(200).json({
      message:
        "Ocurrió un error al querer crear el usuario. Detalle: " +
        error.message,
      exito: false,
    });
  }
});

router.post("/reunion/adultoResponsable", (req, res) => {
  let idUsuarios = [];
  req.body.adultosResponsables.forEach((adulto) => {
    adulto.seleccionado && idUsuarios.push(adulto.idUsuario);
  });

  Empleado.findOne({ idUsuario: req.body.idUsuarioEmpleado })
    .then((empleado) => {
      Suscripcion.notificacionGrupal(
        idUsuarios,
        `Solicitud de reunión de ${empleado.apellido} ${empleado.nombre}`,
        cuerpo
      );
      res.status(200).json({
        message: "Se envió la notificación a los adultos responsables",
        exito: true,
      });
    })
    .catch((e) => {
      res.status(400).json({
        message:
          "Ocurrió un error al querer notificar a los adultos responsables",
        exito: false,
      });
    });
});

module.exports = router;
