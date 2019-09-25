const webpush = require("web-push");
const Usuario = require("../models/usuario");
const vapidKeys = require("../assets/vapid_keys");

// Función para enviar notif a un usuario con la id correspondiente.
// #resolve permitir recibir un vector de ids
function notificar(idusuario, titulo, cuerpo) {
  Usuario.findOne({ _id: idusuario }).then(usuario => {
    const allSubscriptions = usuario.suscripciones;
    console.dir(allSubscriptions);

    const notificationPayload = {
      notification: {
        title: titulo,
        body: cuerpo,
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        },
        actions: [
          {
            action: "explore",
            title: "Go to the site"
          }
        ]
      }
    };

    try {
      webpush.setVapidDetails(
        "www.google.com.ar",
        vapidKeys.vapid_public_key,
        vapidKeys.vapid_private_key
      );
    } catch (error) {
      console.log(error);
    }

    Promise.all(
      allSubscriptions.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(notificationPayload))
      )
    );
  });
};

module.exports.notificar = notificar;
