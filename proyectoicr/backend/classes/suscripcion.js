const webpush = require("web-push");
const Usuario = require("../models/usuario");
const Keys = require("../assets/keys");

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
        primaryKey: 1
      },
      actions: [
        {
          //En frontend vamos a leer que accion es para decidir el routeo.
          action: "home",
          title: "Go to the site"
        }
      ]
    }
  };

  webpush.setVapidDetails(
    "https://my-site.com/contact",
    Keys.vapid_public_key,
    Keys.vapid_private_key
  );

  if (allSubscriptions) {
    Promise.all(
      allSubscriptions.map(sub =>
        webpush
          .sendNotification(sub, JSON.stringify(notificationPayload))
          .then(sendRes => {
            console.log(">Notif. enviada.");
          })
          .catch(e => {
            console.log(e.headers.body);
          })
      )
    );
  } else {
    console.log("No hay suscripciones para este usuario.");
  }
};

// #resolve Considerar en el futuro pasar las acciones que se quieren y la url a donde redirigir.
function notificacionIndividual(idusuario, titulo, cuerpo) {
  // Busco las suscripciones del usuario
  Usuario.findOne({ _id: idusuario })
    .then(usuario => {
      const allSubscriptions = usuario.suscripciones;
      notificar(allSubscriptions, titulo, cuerpo);
    })
    .catch(e => {
      console.log(e);
    });
}

//@params: idusuarios vector de ids
function notificacionGrupal(idusuarios, titulo, cuerpo) {
  // Busco las suscripciones del grupo de usuarios
  Usuario.find({ _id: { $in: idusuarios } })
    .then(usuarios => {
      var allSubscriptions = [];
      usuarios.forEach(usuario => {
        allSubscriptions = allSubscriptions.concat(usuario.suscripciones);
      });
      notificar(allSubscriptions, titulo, cuerpo);
    })
    .catch(e => {
      console.log(e);
    });
}

// Notifica a todos los usuarios suscriptos
function notificacionMasiva(titulo, cuerpo) {
  Usuario.find({})
    .then(usuarios => {
      var allSubscriptions = [];
      usuarios.forEach(usuario => {
        allSubscriptions = allSubscriptions.concat(usuario.suscripciones);
      });
      notificar(allSubscriptions, titulo, cuerpo);
    })
    .catch(e => {
      console.log(e);
    });
}

module.exports.notificacionIndividual = notificacionIndividual;
module.exports.notificacionGrupal = notificacionGrupal;
module.exports.notificacionMasiva = notificacionMasiva;
module.exports.notificar = notificar;
