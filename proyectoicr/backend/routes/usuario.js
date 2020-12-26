const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const checkAuthMiddleware = require("../middleware/check-auth");
const router = express.Router();
const Keys = require("../assets/keys");
const mongoose = require("mongoose");
const Usuario = require("../models/usuario");
const Rol = require("../models/rol");
const Empleado = require("../models/empleado");
const Estudiante = require("../models/estudiante");
const AdultoResponsable = require("../models/adultoResponsable");
const Administrador = require("../models/administrador");
const Suscripcion = require("../classes/suscripcion");
const SolicitudReunion = require("../models/solicitudReunion");

//Compara la contraseña ingresada por el usuario con la contraseña pasada por parametro
//si coinciden entonces le permite cambiar la contraseña, sino se lo deniega
router.post("/cambiarPassword", checkAuthMiddleware, async (req, res) => {
  let passwordNueva;
  await bcrypt.hash(req.body.passwordNueva, 10).then((hash) => {
    passwordNueva = hash;
  });
  Usuario.findOne({ email: req.body.usuario })
    .then((usuario) => {
      if (!bcrypt.compareSync(req.body.passwordVieja, usuario.password)) {
        return res.status(403).json({
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer cambiar la contraseña",
        error: error.message,
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
                  .catch((error) => {
                    res.status(500).json({
                      message: "El docente no esta registrado",
                      error: error.message,
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
            .catch((error) => {
              res.status(500).json({
                message: "El rol asignado al usuario no existe",
                error: error.message,
                exito: false,
              });
            });
        }
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "No hay un usuario registrado con este mail",
        error: error.message,
        exito: false,
      });
    });
});

//Envía una notificación de prueba a un email que se envia por parametro
//@params: email del usuario
router.get("/notificacion", checkAuthMiddleware, (req, res) => {
  Usuario.findOne({ email: req.query.email })
    .then((usuario) => {
      Suscripcion.notificacionIndividual(
        usuario._id,
        "Titulo de la notificación de prueba",
        "Cuerpo de la notificación de prueba"
      );
      res.status(200).json({ message: "Prueba de notificación" });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer notificar",
        error: error.message,
      });
    });
});

//Obtiene todos los permisos del rol que se envía por parámetro
//En el caso de que el permiso para la funcionalidad sea:
//2: tiene permiso de lectura y edición
//1: tiene permiso de lectura
//0: no posee permisos
router.get("/permisosDeRol", checkAuthMiddleware, (req, res) => {
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener los permisos del rol",
        error: error.message,
      });
    });
});

//Registra a un usuario con el rol, contraseña e email
//@params: email del usuario
//@params: contraseña del usuario
router.post("/signup", checkAuthMiddleware, (req, res) => {
  Rol.findOne({ tipo: req.body.rol })
    .then((rol) => {
      bcrypt.hash(req.body.password, 10).then((hash) => {
        const usuario = new Usuario({
          email: req.body.email,
          password: hash,
          rol: rol._id,
        });
        usuario.save().then(() => {
          res.status(201).json({
            message: "Usuario creado exitosamente",
            exito: true,
            id: usuario._id,
          });
        });
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer registrar el usuario",
        error: error.message,
      });
    });
});

//El usuario habilita la suscripcion para poder recibir las notificaciones
router.post("/suscripcion", checkAuthMiddleware, (req, res) => {
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
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrieron errores al querer registrar la suscripcion",
        error: error.message,
      });
    });
});

router.get("/obtenerNombreApellido", checkAuthMiddleware, (req, res) => {
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
      .catch((error) => {
        res.status(500).json({
          message: "Ocurrió un error al querer obtener el nombre y apellido",
          error: error.message,
        });
      });
  }
});

//Registra a un nuevo usuario Admin
//@params: email del usuario
//@params: contraseña del usuario
router.post("/signup/admin", checkAuthMiddleware, async (req, res) => {
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
    res.status(500).json({
      message: "Ocurrió un error al querer crear el usuario",
      error: error.message,
    });
  }
});

// Solicitud para planificar una reunión con adultos responsables del estudiante
router.post(
  "/reunion/adultoResponsable",
  checkAuthMiddleware,
  async (req, res) => {
    try {
      let idUsuarios = [];
      req.body.adultosResponsables.forEach((adulto) => {
        adulto.seleccionado && idUsuarios.push(adulto.idUsuario);
      });

      let empleado = await Empleado.findOne({
        idUsuario: req.body.idUsuarioEmpleado,
      });
      if (!empleado) {
        empleado = await Administrador.findOne({
          idUsuario: req.body.idUsuarioEmpleado,
        });
      }

      Suscripcion.notificacionGrupal(
        idUsuarios,
        `Solicitud de reunión de ${empleado.apellido} ${empleado.nombre}`,
        req.body.cuerpo
      );
      res.status(200).json({
        message: "Se envió la notificación a los adultos responsables",
        exito: true,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Ocurrió un error al querer notificar a los adultos responsables",
        error: error.message,
      });
    }
  }
);

router.get("/reunion/docente/validarFechas", checkAuthMiddleware, (req, res) => {
  let fecha = new Date();
  let aux = new Date();
  aux.setDate(fecha.getDate() - 7);
  SolicitudReunion.findOne({
    idDocente: req.query.idDocente,
    idAdultoResponsable: req.query.idAdultoResponsable,
  })
    .then((SR) => {
      if (SR == null || SR.fecha <= aux) {
        res.status(200).json({
          exito: true,
          message: "Se obtuvo la fecha correctamente y es valido enviar.",
        });
      } else {
        res.status(200).json({
          exito: false,
          message: "Se obtuvo la fecha correctamente pero no es valido enviar.",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer validar las notificaciones enviadas",
        error: error.message,
      });
    });
});

// Solicitud para planificar una reunión con un docente.
router.post("/reunion/docente", checkAuthMiddleware, (req, res) => {
  AdultoResponsable.findOne({ idUsuario: req.body.idAdulto })
    .then((adulto) => {
      Suscripcion.notificacionIndividual(
        req.body.idDocente,
        `Solicitud de reunión de ${adulto.apellido} ${adulto.nombre}`,
        req.body.cuerpo
      );
      SolicitudReunion.findOne({
        idDocente: req.body.idDocente,
        idAdultoResponsable: req.body.idAdulto,
      }).then(async (SR) => {
        fechaHoy = new Date();
        if (SR) {
          SolicitudReunion.findOneAndUpdate(
            {
              idDocente: req.body.idDocente,
              idAdultoResponsable: req.body.idAdulto,
            },
            {
              fecha: fechaHoy,
            }
          ).exec();
        } else {
          const PrimeraSolicitud = new SolicitudReunion({
            fecha: fechaHoy,
            idDocente: req.body.idDocente,
            idAdultoResponsable: req.body.idAdulto,
          });
          PrimeraSolicitud.save();
        }
      });

      res.status(200).json({
        message: "Se envió la notificación al docente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: "Ocurrió un error al querer solicitar la reunión",
        error: error.message,
      });
    });
});

//Validar que los datos sean correctos
router.get("/validate", checkAuthMiddleware, async (req, res) => {
  try {
    Usuario.findOne({
      email: req.query.email,
    }).then((adultoResponsable) => {
      if (adultoResponsable != null) {
        return res.status(200).json({
          message: "Ya existe un usuario con ese email.",
          exito: false,
        });
      } else {
        AdultoResponsable.findOne({
          numeroDocumento: req.query.DNI,
          tipoDocumento: req.query.TipoDocumento,
        }).then((adultoResponsable) => {
          if (adultoResponsable != null) {
            return res.status(200).json({
              message:
                "Ya existe un usuario con ese tipo y número de documento.",
              exito: false,
            });
          } else {
            Empleado.findOne({
              numeroDocumento: req.query.DNI,
              tipoDocumento: req.query.TipoDocumento,
            }).then((empleado) => {
              if (empleado != null) {
                return res.status(200).json({
                  message:
                    "Ya existe un usuario con ese tipo y número de documento.",
                  exito: false,
                });
              } else {
                Estudiante.findOne({
                  numeroDocumento: req.query.DNI,
                  tipoDocumento: req.query.TipoDocumento,
                }).then((estudiante) => {
                  if (estudiante != null) {
                    return res.status(200).json({
                      message:
                        "Ya existe un usuario con ese tipo y número de documento.",
                      exito: false,
                    });
                  } else {
                    return res.status(200).json({
                      message: "Validado correctamente",
                      exito: true,
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Ocurrió un error al querer validar los datos",
      error: error.message,
    });
  }
});

module.exports = router;
