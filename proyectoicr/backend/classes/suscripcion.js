const webpush = require("web-push");
const mongoose = require("mongoose");
const Usuario = require("../models/usuario");
const vapidKeys = require("../assets/vapid_keys");

webpush.setVapidDetails(
  "mailtoexample@ejemplo.org",
  vapidKeys.vapid_public_key,
  vapidKeys.vapid_private_key
  );
  modules.exports = {

  notificar: function(idusuario, titulo, cuerpo) {
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

      Promise.all(
        allSubscriptions.map(sub =>
          webpush.sendNotification(sub, JSON.stringify(notificationPayload))
        )
      );
    });
  }
};
