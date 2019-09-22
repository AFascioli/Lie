const webpush = require("web-push");
const mongoose = require("mongoose");
const Usuario = require("../models/usuario");

const vapidKeys = {
  publicKey:
    "BMlC2dLJTBP6T1GCl3S3sDBmhERNVcjN7ff2a6JAoOg8bA_qXjikveleRwjz0Zn8c9-58mnrNo2K4p07UPK0DKQ",
  privateKey: "nvrxnM7juFwnVOaGA0gY6S7KWKi69ZVC0z7jU5bmQss"
};
webpush.setVapidDetails(
  "mailtoexample@ejemplo.org",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export function notificar(idusuario, titulo, cuerpo) {

  Usuario.findOne({ _id: idusuario }).then((usuario) => {

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
  )
    .then(() =>
      res.status(200).json({ message: "Notificaciones enviadas correctamente" })
    )
    .catch(err => {
      console.error("Error al enviar notificaciones: ", err);
      res.sendStatus(500);
    });
  });

}

export function suscribir() {}
