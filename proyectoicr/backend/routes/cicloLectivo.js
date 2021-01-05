const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");
const Curso = require("../models/curso");
const ClaseEstado = require("../classes/estado");
const ClaseCicloLectivo = require("../classes/cicloLectivo");
const ClaseInscripcion = require("../classes/inscripcion");

router.get("/parametros", checkAuthMiddleware, async (req, res) => {
  CicloLectivo.findById(await ClaseCicloLectivo.obtenerIdCicloActual())
    .then((cicloLectivo) => {
      if (cicloLectivo) {
        res.status(200).json({
          cicloLectivo: cicloLectivo,
          message:
            "Se han obtenido los parámetros correspondientes a este año exitosamente",
          exito: true,
        });
      } else {
        res.status(200).json({
          message:
            "No se han obtenido los parámetros correspondientes a este año",
          exito: false,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los parámetros correspondientes",
        error: error.message,
      });
    });
});

router.post("/parametros", checkAuthMiddleware, async (req, res) => {
  CicloLectivo.findByIdAndUpdate(
    await ClaseCicloLectivo.obtenerIdCicloActual(),
    {
      horarioLLegadaTarde: req.body.horaLlegadaTarde,
      horarioRetiroAnticipado: req.body.horaRetiroAnticipado,
      cantidadFaltasSuspension: req.body.cantidadFaltasSuspension,
      cantidadMateriasInscripcionLibre:
        req.body.cantidadMateriasInscripcionLibre,
    }
  )
    .exec()
    .then((cicloLectivo) => {
      res.status(200).json({
        cicloLectivo: cicloLectivo,
        message:
          "Se han guardado los parámetros correspondientes a este año exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un problema al guardar los parámetros",
        error: error.message,
      });
    });
});

router.get(
  "/cantidadFaltasSuspension",
  checkAuthMiddleware,
  async (req, res) => {
    CicloLectivo.findById(await ClaseCicloLectivo.obtenerIdCicloActual())
      .then((cicloLectivo) => {
        res.status(200).json({
          faltas: cicloLectivo.cantidadFaltasSuspension,
          message:
            "Se han obtenido la cantidad de faltas para la suspesión exitosamente",
          exito: true,
        });
      })
      .catch((error) => {
        res.status(500).json({
          message:
            "Ocurrió un error al querer obtenido la cantidad de faltas para la suspesión",
          error: error.message,
        });
      });
  }
);

router.get("/horaLlegadaTarde", checkAuthMiddleware, async (req, res) => {
  CicloLectivo.findById(await ClaseCicloLectivo.obtenerIdCicloActual())
    .then((cicloLectivo) => {
      res.status(200).json({
        hora: cicloLectivo.horarioLLegadaTarde,
        message: "Se han obtenido el horario de llegada tarde exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el horario de llegada tarde",
        error: error.message,
      });
    });
});

router.get("/horaRetiroAnticipado", checkAuthMiddleware, async (req, res) => {
  CicloLectivo.findById(await ClaseCicloLectivo.obtenerIdCicloActual())
    .then((cicloLectivo) => {
      res.status(200).json({
        hora: cicloLectivo.horarioRetiroAnticipado,
        message: "Se han obtenido el horario de retiro anticipado exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener el horario de retiro anticipado",
        error: error.message,
      });
    });
});

router.get("/materiasParaLibre", checkAuthMiddleware, async (req, res) => {
  CicloLectivo.findById(await ClaseCicloLectivo.obtenerIdCicloActual())
    .then((cicloLectivo) => {
      res.status(200).json({
        materias: cicloLectivo.cantidadMateriasInscripcionLibre,
        message:
          "Se han obtenido la cantidad de materias para estado Libre exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener la cantidad de materias para estado Libre",
        error: error.message,
      });
    });
});

//Obtiene el estado del ciclo lectivo actual
router.use("/estado", checkAuthMiddleware, async (req, res) => {
  let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
  CicloLectivo.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(idCicloActual),
      },
    },
    {
      $lookup: {
        from: "estado",
        localField: "estado",
        foreignField: "_id",
        as: "datosEstado",
      },
    },
  ])
    .then((cicloLectivo) => {
      res.status(200).json({
        exito: true,
        message: "Estado encontrado exitosamente",
        estadoCiclo: cicloLectivo[0].datosEstado[0].nombre,
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error.message,
        message: "Ocurrió un error al obtener el estado del ciclo lectivo: ",
      });
    });
});

router.get("/inicioCursado", checkAuthMiddleware, async (req, res) => {
  try {
    // Validar que todas las agendas esten definidas
    let idCreado = await ClaseEstado.obtenerIdEstado("CicloLectivo", "Creado");
    let idEnPrimerTrimestre = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "En primer trimestre"
    );
    let resultado = await ClaseCicloLectivo.cursosTienenAgenda();

    if (resultado.length != 0) {
      let mensaje =
        "Los siguientes cursos no tienen la agenda de cursado definida: ";

      resultado.map((curso) => {
        mensaje += curso.nombre + "; ";
      });

      mensaje = mensaje.slice(0, mensaje.length - 2);

      return res.status(200).json({
        cursosSinAgenda: resultado,
        exito: false,
        message: mensaje,
      });
    }

    // Pasar las inscripciones pendientes a activas (con todo lo que implica)
    await ClaseCicloLectivo.pasarInscripcionesAActivas();

    //Inactivamos el ciclo anterior
    const idEstadoInactivo = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "Inactivo"
    );

    await CicloLectivo.findByIdAndUpdate(
      await ClaseCicloLectivo.obtenerIdCicloActual(),
      {
        estado: idEstadoInactivo,
      }
    );

    // Actualizar el estado del actual de Creado a En primer trimestre
    await CicloLectivo.findOneAndUpdate(
      { estado: idCreado },
      { estado: idEnPrimerTrimestre }
    ).exec();

    let cicloActual = await CicloLectivo.findById(
      ClaseCicloLectivo.obtenerIdCicloActual()
    );

    // Crear el proximo ciclo lectivo
    let cicloProximo = new CicloLectivo({
      horarioLLegadaTarde: 8,
      horarioRetiroAnticipado: 10,
      cantidadFaltasSuspension: 15,
      cantidadMateriasInscripcionLibre: 3,
      año: cicloActual + 1,
      estado: idCreado,
    });
    await cicloProximo.save();

    // Crear los cursos del año siguiente
    await ClaseCicloLectivo.crearCursosParaCiclo(cicloProximo._id);

    res.status(200).json({
      exito: true,
      message: "Inicio de cursado exitoso",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Ocurrió un error al querer iniciar el cursado",
    });
  }
});

//En el caso de que se pueda modificar la agenda devuelve true, false caso contrario
router.get("/modificarAgenda", checkAuthMiddleware, async (req, res) => {
  let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
  try {
    CicloLectivo.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(idCicloActual),
        },
      },
      {
        $lookup: {
          from: "estado",
          localField: "estado",
          foreignField: "_id",
          as: "datosEstado",
        },
      },
    ]).then((cicloLectivo) => {
      let nombre = cicloLectivo[0].datosEstado[0].nombre;
      if (nombre === "En examenes" || nombre === "Fin examenes") {
        return res.status(200).json({
          puedeModificar: false,
          creado: false,
          message: "No esta habilitado el modificar la agenda actual",
        });
      }

      if (nombre === "Creado") {
        return res.status(200).json({
          puedeModificar: true,
          creado: true,
          message: "No esta habilitado el modificar la agenda actual",
        });
      }

      res.status(200).json({
        puedeModificar: true,
        creado: false,
        message: "Está habilitado el modificar la agenda actual",
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Ocurrieron errores al querer validar los permisos",
    });
  }
});

router.get("/periodoCursado", checkAuthMiddleware, async (req, res) => {
  let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();

  try {
    CicloLectivo.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(idCicloActual),
        },
      },
      {
        $lookup: {
          from: "estado",
          localField: "estado",
          foreignField: "_id",
          as: "datosEstado",
        },
      },
    ]).then((cicloLectivo) => {
      let nombre = cicloLectivo[0].datosEstado[0].nombre;
      if (
        nombre == "En primer trimestre" ||
        nombre == "En segundo trimestre" ||
        nombre == "En tercer trimestre"
      ) {
        return res.status(200).json({
          permiso: true,
          message: "Está dentro del periodo de cursado",
        });
      }

      res.status(200).json({
        permiso: false,
        message: "No se encuentra dentro del periodo de cursado",
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message:
        "Ocurrió un error al querer determinar si está dentro del periodo de cursado",
    });
  }
});

// Endpoint que usa el director para cerrar un trimestre. Primero se fija si hay algun curso que no tenga cerrada
// alguna materia. Si esta todo legal realiza la logica correspondiente.
router.post("/cierreTrimestre", checkAuthMiddleware, async (req, res) => {
  let trimestre = parseInt(req.body.trimestre, 10);

  let materiasSinCerrar = await ClaseCicloLectivo.materiasSinCerrar(trimestre);

  if (materiasSinCerrar.length != 0) {
    res.status(200).json({
      exito: false,
      message:
        "No se pudo cerrar el trimestre porque las siguientes materias aún no estan cerradas: ",
      materiasSinCerrar: materiasSinCerrar,
    });
  } else {
    let mensajeResponse = "Trimestre cerrado correctamente";

    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
    let idEstadoCiclo;

    if (trimestre == 3) {
      await ClaseCicloLectivo.actualizarEstadoInscripciones();
      mensajeResponse = "Cierre de cursado realizado correctamente";
      idEstadoCiclo = await ClaseEstado.obtenerIdEstado(
        "CicloLectivo",
        "En examenes"
      );
    } else {
      if (trimestre == 1) {
        idEstadoCiclo = await ClaseEstado.obtenerIdEstado(
          "CicloLectivo",
          "En segundo trimestre"
        );
      } else {
        idEstadoCiclo = await ClaseEstado.obtenerIdEstado(
          "CicloLectivo",
          "En tercer trimestre"
        );
      }
    }

    await CicloLectivo.findByIdAndUpdate(idCicloActual, {
      estado: idEstadoCiclo,
    });

    res.status(200).json({
      exito: true,
      message: mensajeResponse,
    });
  }
});

//Cierra la etapa de examenes. Se realizan 2 operaciones: Cambiar inscripciones con examenes pendientes a
// su estado correspondiente (tambien se cambia el estado de las CXM pendientes), Cambia estado ciclo actual
router.get("/cierreExamenes", checkAuthMiddleware, async (req, res) => {
  try {
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();

    await ClaseInscripcion.cambiarEstadoExamPendientes(idCicloActual);

    const idFinExamenes = await ClaseEstado.obtenerIdEstado(
      "CicloLectivo",
      "Fin examenes"
    );
    await CicloLectivo.findByIdAndUpdate(idCicloActual, {
      estado: idFinExamenes,
    });

    res.status(200).json({
      exito: true,
      message: "Etapa de exámenes cerrada exitosamente.",
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      message: "Ocurrió un error al intentar cerrar la etapa de exámenes",
    });
  }
});

// Busca todos los ciclos lectivos
router.get("/anios", checkAuthMiddleware, (req, res) => {
  CicloLectivo.find()
    .then((ciclosLectivos) => {
      var respuesta = [];
      ciclosLectivos.forEach((ciclo) => {
        var anios = {
          id: ciclo._id,
          anio: ciclo.año.toString(),
        };
        respuesta.push(anios);
      });
      res.status(200).json({
        respuesta: respuesta,
        message: "Se han obtenido los años de ciclo lectivo",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un error al querer obtener los años de ciclo lectivo",
        error: error.message,
      });
    });
});

/*Devuelve todos los cursos del ciclo lectivo actual, cada uno de ello con las materias y los estados de
esas materias */
router.get("/curso/materia/estado", checkAuthMiddleware, async (req, res) => {
  try {
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
    let cursosConMXCYEstados = await Curso.aggregate([
      {
        $match: {
          cicloLectivo: mongoose.Types.ObjectId(idCicloActual),
        },
      },
      {
        $unwind: {
          path: "$materias",
        },
      },
      {
        $lookup: {
          from: "materiasXCurso",
          localField: "materias",
          foreignField: "_id",
          as: "MXC",
        },
      },
      {
        $lookup: {
          from: "estado",
          localField: "MXC.estado",
          foreignField: "_id",
          as: "estadoMXC",
        },
      },
      {
        $lookup: {
          from: "materia",
          localField: "MXC.idMateria",
          foreignField: "_id",
          as: "nombreMateria",
        },
      },
      {
        $project: {
          estadoMXC: 1,
          nombre: 1,
          nombreMateria: 1,
        },
      },
      {
        $group: {
          _id: "$nombre",
          nombreMateria: {
            $push: "$nombreMateria.nombre",
          },
          estado: {
            $push: "$estadoMXC.nombre",
          },
        },
      },
    ]);

    let responseCursos = [];
    cursosConMXCYEstados.forEach((curso) => {
      let datosCurso = { nombre: curso._id, materiasConEstado: [] };
      curso.estado.forEach((estado, index) => {
        let materiaConEstado = {
          materia: curso.nombreMateria[index][0],
          estado: estado[0],
        };
        datosCurso.materiasConEstado.push(materiaConEstado);
      });
      responseCursos.push(datosCurso);
    });

    res.status(200).json({
      cursosEstados: responseCursos,
      message:
        "Se han obtenido los estados de las materias de los cursos exitosamente",
      exito: true,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Ocurrió un error al querer obtener los estados de las materias de los cursos",
      error: error.message,
    });
  }
});

router.get("/actualYSiguiente", async (req, res) => {
  try {
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();
    let idCicloProximo = await ClaseCicloLectivo.obtenerIdCicloProximo();

    let cicloActual = await CicloLectivo.findById(idCicloActual).exec();
    let cicloProximo = await CicloLectivo.findById(idCicloProximo).exec();

    res.status(200).json({
      añosCiclos: [cicloActual.año, cicloProximo.año],
      message: "Se han obtenido los años de los ciclos actual y siguiente",
      exito: true,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Ocurrió un error al querer obtener los ciclos actual y siguiente",
      error: error.message,
    });
  }
});

router.get("/actualYAnteriores", async (req, res) => {
  try {
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloActual();

    let cicloActual = await CicloLectivo.findById(idCicloActual).exec();

    let ciclosAnteriores = await CicloLectivo.find({
      año: { $lt: cicloActual.año },
    }).exec();

    let arrayAños = [cicloActual.año];

    ciclosAnteriores.forEach((ciclo) => {
      arrayAños.push(ciclo.año);
    });

    arrayAños.sort((a, b) => {
      return a - b;
    });

    res.status(200).json({
      añosCiclos: arrayAños,
      message: "Se han obtenido los años de los ciclos actual y anteriores",
      exito: true,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Ocurrió un error al querer obtener los años de los ciclos actual y anteriores",
      error: error.message,
    });
  }
});

module.exports = router;
