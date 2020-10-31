const webpush = require("web-push");
const Usuario = require("../models/usuario");
const Keys = require("../assets/keys");
const Estudiante = require("../models/estudiante");
const AdultoResponsable = require("../models/adultoResponsable");

// Notifica al conjunto de suscripciones con el contenido provisto.
// @params {Array<Subscriptions>} allSubscriptions
function notificar(allSubscriptions, titulo, cuerpo) {
  const notificationPayload = {
    notification: {
      title: titulo,
      body: cuerpo,
      icon: "./assets/icons/icon-144.png", //Path del frontend. El payload lo resuelve el ServiceWorker.
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          //En frontend vamos a leer que accion es para decidir el routeo.
          action: "home",
          title: "Go to the site",
        },
      ],
    },
  };

  webpush.setVapidDetails(
    "https://proyectolie.software",
    Keys.vapid_public_key,
    Keys.vapid_private_key
  );

  if (allSubscriptions) {
    Promise.all(
      allSubscriptions.map((sub) =>
        webpush
          .sendNotification(sub, JSON.stringify(notificationPayload))
          .then((sendRes) => {
            console.log(">Notif. enviada.");
          })
          .catch((e) => {
            console.log(e);
          })
      )
    );
  } else {
    console.log("No hay suscripciones para este usuario.");
  }
}

// #resolve Considerar en el futuro pasar las acciones que se quieren y la url a donde redirigir.
function notificacionIndividual(idusuario, titulo, cuerpo) {
  // Busco las suscripciones del usuario
  Usuario.findOne({ _id: idusuario }).then((usuario) => {
    const allSubscriptions = usuario.suscripciones;
    console.log("suscripciones", allSubscriptions);
    notificar(allSubscriptions, titulo, cuerpo);
  });
}

//@params: idusuarios vector de ids
function notificacionGrupal(idusuarios, titulo, cuerpo) {
  // Busco las suscripciones del grupo de usuarios
  Usuario.find({ _id: { $in: idusuarios } }).then((usuarios) => {
    var allSubscriptions = [];
    usuarios.forEach((usuario) => {
      allSubscriptions = allSubscriptions.concat(usuario.suscripciones);
    });
    notificar(allSubscriptions, titulo, cuerpo);
  });
}

// Notifica a todos los usuarios suscriptos
function notificacionMasiva(titulo, cuerpo) {
  Usuario.find({}).then((usuarios) => {
    var allSubscriptions = [];
    usuarios.forEach((usuario) => {
      allSubscriptions = allSubscriptions.concat(usuario.suscripciones);
    });
    notificar(allSubscriptions, titulo, cuerpo);
  });
}

//Obtener id de usuario de los AR de un estudiante dado
//@params: idEstudiante
async function obtenerIdsUsuarios(idEstudiante) {
  let vectorIdsUsuarios = [];
  await Estudiante.findById(idEstudiante, {
    adultoResponsable: 1,
    _id: 0,
  }).then(async (objConids) => {
    for (const idAR of objConids.adultoResponsable) {
      await AdultoResponsable.findById(idAR, { idUsuario: 1, _id: 0 }).then(
        (objConId) => {
          vectorIdsUsuarios.push(objConId.idUsuario);
        }
      );
    }
  });
  return vectorIdsUsuarios;
}

//Filtra los AR y devuelve su idUsuario si este acepta recepcion del tipo de notificacion dado
async function filtrarARPorPreferencias(idsUsuariosAR, tipoNotificacion) {
  let idsUsuariosAceptan = [];
  for (const idUsuarioAR of idsUsuariosAR) {
    await AdultoResponsable.findOne({ idUsuario: idUsuarioAR }).then(
      (adultoEncontrado) => {
        let aceptaNotificacion = adultoEncontrado.preferenciasPush.some(
          (preferencia) =>
            preferencia.nombre == tipoNotificacion && preferencia.acepta
        );
        aceptaNotificacion && idsUsuariosAceptan.push(idUsuarioAR);
      }
    );
  }
  return idsUsuariosAceptan;
}

module.exports.notificacionIndividual = notificacionIndividual;
module.exports.notificacionGrupal = notificacionGrupal;
module.exports.notificacionMasiva = notificacionMasiva;
module.exports.notificar = notificar;
module.exports.obtenerIdsUsuarios = obtenerIdsUsuarios;
module.exports.filtrarARPorPreferencias = filtrarARPorPreferencias;
