const express = require("express");
const Estudiante = require("../models/estudiante");
const Inscripcion = require("../models/inscripcion");
const Division = require("../models/division");
const AsistenciaDiaria = require("../models/asistenciaDiaria");
const router = express.Router();

//Registra un nuevo estudiante en la base de datos
router.post("", (req, res, next) => {
  const estudiante = new Estudiante({
    apellido: req.body.apellido,
    nombre: req.body.nombre,
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
    cuil: req.body.cuil,
    sexo: req.body.sexo,
    calle: req.body.calle,
    numeroCalle: req.body.numeroCalle,
    piso: req.body.piso,
    departamento: req.body.departamento,
    provincia: req.body.provincia,
    localidad: req.body.localidad,
    codigoPostal: req.body.codigoPostal,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    estadoCivil: req.body.estadoCivil,
    telefonoFijo: req.body.telefonoFijo,
    adultoResponsable: "null",
    activo: true
  });
  estudiante
    .save()
    .then(() => {
      res.status(201).json({
        message: "Estudiante registrado correctamente!"
      });
    })
    .catch(err => console.log("Error al meter en la bd estudiante" + err));
});

//Obtiene un estudiante dado un numero y tipo de documento
router.get("/documento", (req, res, next) => {
  const tipo = req.query.tipo;
  const numero = req.query.numero;

  Estudiante.find({
    tipoDocumento: tipo,
    numeroDocumento: numero,
    activo: true
  }).then(documents => {
    res.status(200).json({
      estudiantes: documents
    });
  });
});

//Busqueda de un estudisante por nombre y apellido ignorando mayusculas
router.get("/nombreyapellido", (req, res, next) => {
  const nombre = req.query.nombre;
  const apellido = req.query.apellido;
  Estudiante.find({
    nombre: { $regex: new RegExp(nombre, "i") },
    apellido: { $regex: new RegExp(apellido, "i") },
    activo: true
  }).then(documents => {
    res.status(200).json({
      estudiantes: documents
    });
  });
});

//Modifica un estudiante
router.patch("/modificar", (req, res, next) => {
  Estudiante.findByIdAndUpdate(req.body._id, {
    apellido: req.body.apellido,
    nombre: req.body.nombre,
    tipoDocumento: req.body.tipoDocumento,
    numeroDocumento: req.body.numeroDocumento,
    cuil: req.body.cuil,
    sexo: req.body.sexo,
    calle: req.body.calle,
    numeroCalle: req.body.numeroCalle,
    piso: req.body.piso,
    departamento: req.body.departamento,
    provincia: req.body.provincia,
    localidad: req.body.localidad,
    codigoPostal: req.body.codigoPostal,
    nacionalidad: req.body.nacionalidad,
    fechaNacimiento: req.body.fechaNacimiento,
    estadoCivil: req.body.estadoCivil,
    telefonoFijo: req.body.telefonoFijo,
    adultoResponsable: "null"
  }).then(() => {
    res.status(200).json({
      message: "Estudiante exitosamente modificado"
    });
  });
});

//Borrado logico de un estudiante
router.delete("/borrar", (req, res, next) => {
  Estudiante.findOneAndUpdate({ _id: req.query._id }, { activo: false }).then(
    () => {
      res.status(202).json({
        message: "Estudiante exitosamente borrado"
      });
    }
  );
});

//Retorna un vector que tiene objetos (estudianteRedux) que tienen _id, nombre, apellido, presente y fecha.
//Se tiene que crear el vector estudiantesRedux para que devuelva los datos bien al frontend
//Se tiene que convertir la fecha porque Date esta en UTC y en argentina estamos en UTC-3
router.get("/division", (req, res, next) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "divisiones",
        localField: "IdDivision",
        foreignField: "_id",
        as: "division"
      }
    },
    {
      $lookup: {
        from: "estudiantes",
        localField: "IdEstudiante",
        foreignField: "_id",
        as: "estudiante"
      }
    },
    {
      $match: { "division.curso": req.query.division, activa: true }
    },
    {
      $project: {
        _id: 0,
        "estudiante._id": 1,
        "estudiante.nombre": 1,
        "estudiante.apellido": 1
      }
    }
  ]).then(documents => {
    const fechaActual = new Date();
    fechaActual.setHours(fechaActual.getHours());
    var estudiantesRedux = [];
    documents.forEach(objConEstudiante => {
      let estudianteRedux = {
        _id: objConEstudiante.estudiante[0]._id,
        nombre: objConEstudiante.estudiante[0].nombre,
        apellido: objConEstudiante.estudiante[0].apellido,
        presente: true,
        fecha: fechaActual
      };
      estudiantesRedux.push(estudianteRedux);
    });
    res.status(200).json({
      estudiantesXDivision: estudiantesRedux
    });
  });
});

//Registrar asistencia 2.0, recibe un vector de estudiantes y para cada uno, encuentra la inscripcion que le corresponde
// luego crea la asistencia diaria usando la _id de la inscripcion, luego guarda la asistenciaDiaria y
// guarda la _id de esta asistenciaDiaria en el vector de asistenciasDiarias de la inscripcion.
router.post("/asistencia", (req, res) => {
  req.body.forEach(estudiante => {
    var valorInasistencia = 0;
    if (!estudiante.presente) {
      valorInasistencia = 1;
    }
    Inscripcion.findOne({
      IdEstudiante: estudiante._id,
      activa: true
    }).then(async inscripcion => {
      var asistenciaEstudiante = new AsistenciaDiaria({
        IdInscripcion: inscripcion._id,
        fecha: estudiante.fecha,
        presente: estudiante.presente,
        valorInasistencia: valorInasistencia
      });

      await asistenciaEstudiante.save().then(async asistenciaDiaria => {
        await inscripcion.asistenciaDiaria.push(asistenciaDiaria._id);
        inscripcion.save();
      });
    });
  });

  res.status(201).json({ message: "Asistencia registrada exitósamente" });
});

//Obtiene la id de la asistencia diaria del dia de hoy, y cambia los valores correspondientes en la coleccion de asistencia diaria
router.post("/retiro", (req, res) => {
  Inscripcion.findOne(
    { IdEstudiante: req.body.IdEstudiante, activa: true },
    { asistenciaDiaria: { $slice: -1 } }
  ).then(inscripcion => {
    if (!inscripcion) {
      res.status(200).json({
        message: "El estudiante no está inscripto en ningún curso",
        exito: false
      });
    } else {
      var actualizacionInasistencia = 0.5;
      if (req.body.antes10am) {
        actualizacionInasistencia = 1;
      }
      AsistenciaDiaria.findById(inscripcion.asistenciaDiaria[0])
        .select({ retiroAnticipado: 1, presente: 1 })
        .then(asistencia => {
          if (asistencia) {
            if (!asistencia.presente) {
              res.status(200).json({
                message: "El estudiante esta ausente para el día de hoy",
                exito: "ausente"
              });
            } else {
              if (asistencia.retiroAnticipado) {
                res.status(200).json({
                  message:
                    "El estudiante ya tiene registrado un retiro anticipado para el día de hoy",
                  exito: "retirado"
                });
              } else {
                AsistenciaDiaria.findByIdAndUpdate(
                  inscripcion.asistenciaDiaria[0],
                  {
                    retiroAnticipado: true,
                    $inc: { valorInasistencia: actualizacionInasistencia }
                  }
                ).then(() => {
                  res.status(200).json({
                    message: "Retiro anticipado exitósamente registrado",
                    exito: "exito"
                  });
                });
              }
            }
          } else {
            res.status(200).json({
              message:
                "El estudiante no tiene registrada la asistencia para el día de hoy",
              exito: "faltaasistencia"
            });
          }
        })
        .catch(e => console.log(e));
    }
  });
});

//Vamos a recibir, un vector de los estudiantes a los que se le modificaron los documentos entregados.
router.post("/documentos", (req, res) => {
  try {
    req.body.forEach(estudiante => {
      Inscripcion.findOneAndUpdate(
        { IdEstudiante: estudiante.IdEstudiante, activa: true },
        { $set: { documentosEntregados: estudiante.documentosEntregados } }
      ).exec();
      console.dir(estudiante);
    });
    res
      .status(201)
      .json({ message: "Documentos guardados correctamente", exito: true });
  } catch {
    res.status(201).json({ message: e, exito: false });
  }
});

//Retorna vector con datos de los estudiantes y presente. Si ya se registro una asistencia para
//el dia de hoy se retorna ese valor de la asistencia, sino se "construye" una nueva
router.get("/asistenciatest", (req, res) => {
  Inscripcion.aggregate([
    {
      $lookup: {
        from: "divisiones",
        localField: "IdDivision",
        foreignField: "_id",
        as: "curso"
      }
    },
    {
      $match: {
        "curso.curso": "4A",
        activa: true
      }
    },
    {
      $project: {
        ultimaAsistencia: {
          $slice: ["$asistenciaDiaria", -1]
        }
      }
    },
    {
      $lookup: {
        from: "asistenciaDiaria",
        localField: "ultimaAsistencia",
        foreignField: "_id",
        as: "asistencia"
      }
    },
    {
      $project: {
        _id: 0,
        "asistencia.fecha": 1
      }
    },
    {
      $limit: 1
    }
  ]).then(ultimaAsistencia => {
    var fechaHoy = new Date();
    fechaHoy.setHours(fechaHoy.getHours() - 3);
    console.log(fechaHoy);
    if (
      fechaHoy.getDate() == ultimaAsistencia[0].asistencia[0].fecha.getDate() &&
      fechaHoy.getMonth() ==
        ultimaAsistencia[0].asistencia[0].fecha.getMonth() &&
      fechaHoy.getFullYear() ==
        ultimaAsistencia[0].asistencia[0].fecha.getFullYear()
    ) {
      Inscripcion.aggregate([
        {
          $lookup: {
            from: "divisiones",
            localField: "IdDivision",
            foreignField: "_id",
            as: "curso"
          }
        },
        {
          $lookup: {
            from: "estudiantes",
            localField: "IdEstudiante",
            foreignField: "_id",
            as: "datosEstudiante"
          }
        },
        {
          $match: {
            "curso.curso": "4A",
            activa: true
          }
        },
        {
          $project: {
            ultimaAsistencia: {
              $slice: ["$asistenciaDiaria", -1]
            },
            "datosEstudiante._id": 1,
            "datosEstudiante.nombre": 1,
            "datosEstudiante.apellido": 1
          }
        },
        {
          $lookup: {
            from: "asistenciaDiaria",
            localField: "ultimaAsistencia",
            foreignField: "_id",
            as: "asistencia"
          }
        },
        {
          $project: {
            datosEstudiante: 1,
            "asistencia.presente": 1
          }
        }
      ]).then(asistenciaCurso => {
        var respuesta = [];
        asistenciaCurso.forEach(estudiante => {
          var estudianteRefinado = {
            _id: estudiante.datosEstudiante[0]._id,
            nombre: estudiante.datosEstudiante[0].nombre,
            apellido: estudiante.datosEstudiante[0].apellido,
            presente: estudiante.asistencia[0].presente
          };
          respuesta.push(estudianteRefinado);
        });
        res.status(200).json({ estudiantes: respuesta });
      });
    }

    Inscripcion.aggregate([
      {
        $lookup: {
          from: "divisiones",
          localField: "IdDivision",
          foreignField: "_id",
          as: "curso"
        }
      },
      {
        $lookup: {
          from: "estudiantes",
          localField: "IdEstudiante",
          foreignField: "_id",
          as: "estudiante"
        }
      },
      {
        $match: { "curso.curso": req.query.division, activa: true }
      },
      {
        $project: {
          _id: 0,
          "estudiante._id": 1,
          "estudiante.nombre": 1,
          "estudiante.apellido": 1
        }
      }
    ]).then(documents => {
      const fechaActual = new Date();
      fechaActual.setHours(fechaActual.getHours());
      var estudiantesRedux = [];
      documents.forEach(objConEstudiante => {
        let estudianteRedux = {
          _id: objConEstudiante.estudiante[0]._id,
          nombre: objConEstudiante.estudiante[0].nombre,
          apellido: objConEstudiante.estudiante[0].apellido,
          presente: true
        };
        estudiantesRedux.push(estudianteRedux);
      });
      res.status(200).json({
        estudiantesXCurso: estudiantesRedux
      });
    });
  });
});
module.exports = router;
