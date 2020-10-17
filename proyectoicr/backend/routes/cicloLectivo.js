const express = require("express");
const router = express.Router();
const checkAuthMiddleware = require("../middleware/check-auth");
const CicloLectivo = require("../models/cicloLectivo");
const ClaseEstado = require("../classes/estado");
const ClaseCicloLectivo = require("../classes/cicloLectivo");
const ClaseInscripcion = require("../classes/inscripcion");

router.get("/parametros", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      if (cicloLectivo) {
        res.status(200).json({
          cicloLectivo: cicloLectivo,
          message:
            "Se han obtenido los parametros correspondientes a este año exitosamente",
          exito: true,
        });
      } else {
        res.status(200).json({
          message:
            "No se han obtenido los parametros correspondientes a este año",
          exito: false,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message:
          "Ocurrió un error al querer obtener los parametros correspondientes",
        error: error.message,
      });
    });
});

router.post("/parametros", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOneAndUpdate(
    { año: fechaActual.getFullYear() },
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
          "Se han guardado los parametros correspondientes a este año exitosamente",
        exito: true,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Ocurrió un problema al guardar los parametros",
        error: error.message,
      });
    });
});

router.get("/cantidadFaltasSuspension", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
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
});

router.get("/horaLlegadaTarde", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
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

router.get("/horaRetiroAnticipado", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
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

router.get("/materiasParaLibre", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
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
router.use("/estado", checkAuthMiddleware, (req, res) => {
  let añoActual = new Date().getFullYear();
  CicloLectivo.aggregate([
    {
      $match: {
        año: añoActual,
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

    // Crear el proximo ciclo lectivo
    let cicloProximo = new CicloLectivo({
      horarioLLegadaTarde: 8,
      horarioRetiroAnticipado: 10,
      cantidadFaltasSuspension: 15,
      cantidadMateriasInscripcionLibre: 3,
      año: añoActual + 1,
      estado: idCreado,
    });
    await cicloProximo.save();

    // Crear los cursos del año siguiente
    ClaseCicloLectivo.crearCursosParaCiclo(cicloProximo._id);

    // Actualizar el estado del actual de Creado a En primer trimestre
    CicloLectivo.findOneAndUpdate(
      { año: añoActual, estado: idCreado },
      { estado: idEnPrimerTrimestre }
    ).exec();

    res.status(200).json({
      exito: true,
      message: "Inicio de cursado exitoso.",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Ocurrió un error al querer iniciar el cursado",
    });
  }
});

//En el caso de que se pueda registrar la agenda devuelve true false caso contrario
router.get("/registrarAgenda", checkAuthMiddleware, async (req, res) => {
  let fechaActual = new Date();
  let añoActual = fechaActual.getFullYear();
  try {
    CicloLectivo.aggregate([
      {
        $match: {
          año: añoActual,
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
      if (nombre === "Creado") {
        return nres.status(200).json({
          permiso: false,
          message: "No esta habilitado el registro de la agenda",
        });
      }

      res.status(200).json({
        permiso: true,
        message: "Está habilitado el registro de la agenda",
      });
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Ocurrieron errores al querer validar los permisos",
    });
  }
});

router.get("/periodoCursado", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  let añoActual = fechaActual.getFullYear();

  try {
    CicloLectivo.aggregate([
      {
        $match: {
          año: añoActual,
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
      console.log(nombre);
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

router.get("/", checkAuthMiddleware, (req, res) => {
  let fechaActual = new Date();
  CicloLectivo.findOne({ año: fechaActual.getFullYear() })
    .then((cicloLectivo) => {
      if (cicloLectivo) {
        res.status(200).json({
          cicloLectivo: cicloLectivo,
          message:
            "Se han obtenido las fechas correspondientes a este año exitosamente",
          exito: true,
        });
      } else {
        res.status(200).json({
          message: "No se han obtenido las fechas correspondientes a este año",
          exito: false,
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        message: "Mensaje de error especifico",
      });
    });
});

//Endpoint que usa el director para cerrar un trimestre. Primero se fija si hay algun curso que no tenga cerrada
//alguna materia. Si esta todo legal realiza la logica correspondiente.
router.post("/cierreTrimestre", checkAuthMiddleware, async (req, res) => {
  let materiasSinCerrar = await ClaseCicloLectivo.materiasSinCerrar(req.query.trimestre);
  let trimestre=parseInt(req.body.trimestre, 10);
  if (materiasSinCerrar.length != 0) {
    res
      .status(200)
      .json({
        exito: false,
        message: "No se pudo cerrar el trimestre porque las siguientes materias aún no estan cerradas: ",
        materiasSinCerrar: materiasSinCerrar,
      });
  }else{
    let mensajeResponse="Trimestre cerrado correctamente";
    if(trimestre ==3){
      await ClaseCicloLectivo.actualizarEstadoInscripciones();
      mensajeResponse="Cierre de cursado realizado correctamente";
    }else{
      const idCicloActual= await ClaseCicloLectivo.obtenerIdCicloLectivo(false);
      let idEstadoCiclo;
      if(trimestre==1){
        idEstadoCiclo= await ClaseEstado.obtenerIdEstado("CicloLectivo", "En segundo trimestre");
      }else{
        idEstadoCiclo= await ClaseEstado.obtenerIdEstado("CicloLectivo", "En tercer trimestre");
      }
      await CicloLectivo.findByIdAndUpdate(idCicloActual,{estado: idEstadoCiclo});
    }
    res
      .status(200)
      .json({
        exito: true,
        message: mensajeResponse,
      });
  }
});

//Cierra la etapa de examenes. Se realizan 2 operaciones: Cambiar inscripciones con examenes pendientes a
// su estado correspondiente (tambien se cambia el estado de las CXM pendientes), Cambia estado ciclo actual
router.get("/cierreExamenes", checkAuthMiddleware, async (req, res)=>{
  try {
    let idCicloActual = await ClaseCicloLectivo.obtenerIdCicloLectivo(false);  
    const idEstadoInactivo = await ClaseEstado.obtenerIdEstado("CicloLectivo", "Inactivo");
    await ClaseInscripcion.cambiarEstadoExamPendientes(idCicloActual);
    await CicloLectivo.findByIdAndUpdate(idCicloActual, {estado: idEstadoInactivo});
    
    res.status(200).json({
      exito: true,
      message: "Etapa de exámenes cerrado exitosamente.",
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      message: "Ocurrió un error al intertar cerrar la etapa de exámenes.",
    });
  }
});

module.exports = router;
