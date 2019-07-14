const express = require("express");
const Estudiante = require("../models/estudiante");
const Inscripcion = require("../models/inscripcion");
const Division = require("../models/division");
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
    fechaActual.setHours(fechaActual.getHours() - 3);
    var estudiantesRedux = [];
    documents.forEach(objConEstudiante => {
      let estudianteRedux = {
        _id: objConEstudiante.estudiante[0]._id,
        nombre: objConEstudiante.estudiante[0].nombre,
        apellido: objConEstudiante.estudiante[0].apellido,
        presente: false,
        fecha: fechaActual.toISOString().split("T")[0]
      };
      estudiantesRedux.push(estudianteRedux);
    });
    res.status(200).json({
      estudiantesXDivision: estudiantesRedux
    });
  });
});

//Busca cada inscripcion segun el _id del estudiante y le registra el presentismo de esa fecha
router.post("/asistencia", (req, res) => {
  try {
    req.body.forEach(estudiante => {
      const valorInasistencia=0;
      if(!estudiante.presente){
        valorInasistencia=1;
      }
      Inscripcion.findOneAndUpdate(
        { IdEstudiante: estudiante._id, activa: true },
        {
          $push: {
            asistenciaDiaria: {
              fecha: estudiante.fecha,
              presente: estudiante.presente,
              valorInasistencia: valorInasistencia
            }
          }
        }
      ).then(document => {});
    });
    res.status(201).json({ message: "Asistencia registrada exitósamente" });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
