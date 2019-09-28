const webpush = require("web-push");
const Usuario = require("../models/usuario");
const vapidKeys = require("../assets/vapid_keys");

// Función para enviar notif a un usuario con la id correspondiente.
// #resolve permitir recibir un vector de ids
// #resolve Considerar en el futuro pasar las acciones que se quieren y la url a donde redirigir.
function notificar(idusuario, titulo, cuerpo) {
  Usuario.findOne({ _id: idusuario }).then(usuario => {
    const allSubscriptions = usuario.suscripciones;

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

    webpush.setVapidDetails(
      "https://my-site.com/contact",
      vapidKeys.vapid_public_key,
      vapidKeys.vapid_private_key
    );

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
  })
  .catch((e) => {
    console.log(e);
 });
}

function notificarAll(idusuarios, titulo, cuerpo) {
  Usuario.find({ _id: { $in: idusuarios } }).then(usuarios => {
    const allSubscriptions = [];

    usuarios.forEach(usuario => {
      allSubscriptions.concat(usuario.suscripciones);
    });

    console.log('Total de suscripciones: ');
    console.log(allSubscriptions.length());
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

      webpush.setVapidDetails(
        "https://my-site.com/contact",
        vapidKeys.vapid_public_key,
        vapidKeys.vapid_private_key
      );

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
    })
    .catch((e) => {
       console.log(e);
    });
}

module.exports.notificar = notificar;
module.exports.notificarAll = notificarAll;
