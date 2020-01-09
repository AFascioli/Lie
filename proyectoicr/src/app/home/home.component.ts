import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Evento } from '../eventos/evento.model';
import { EventosService } from '../eventos/eventos.service';
//Parche para la demo #resolve
declare var require: any;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  eventos: Evento[];
  imagen;
  readonly VAPID_PUBLIC =
    "BMlC2dLJTBP6T1GCl3S3sDBmhERNVcjN7ff2a6JAoOg8bA_qXjikveleRwjz0Zn8c9-58mnrNo2K4p07UPK0DKQ";

  constructor(private swPush: SwPush, private servicioAuth: AutenticacionService, private servicioEvento: EventosService ) {}

  getImage(imgUrl){
    return require("backend/images/"+imgUrl)
  }

  ngOnInit() {
    this.servicioEvento.obtenerEvento().subscribe(rtdo => {
      console.log(rtdo);
      this.eventos = rtdo.eventos;
    })
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("ngsw-worker.js").then(swreg => {
        if (swreg.active) {
          console.log("Se registro el service worker.");
          this.subscribeToNotifications();
        }
      });
    }
  }

  obra = require("../../img/acto.jpg");
  desfile = require("../../img/desfile.jpg");

  subscribeToNotifications() {
    if (Notification.permission === "granted") {
      console.log("Ya se otorgó el permiso de envio de notificaciones.");
    } else {
      this.swPush
        .requestSubscription({
          serverPublicKey: this.VAPID_PUBLIC
        })
        .then(pushsub => {
          this.servicioAuth.addPushSubscriber(pushsub).subscribe(res => {
            console.log('Se suscribió a recibir notificaciones push.');
          });
        })
        .catch(err =>
          console.error("No se pudo suscribir a las notificaciones push.", err)
        );
    }
  }
}
