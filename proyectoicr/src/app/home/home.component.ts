import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AutencacionService } from "../login/autenticacionService.service";
//Parche para la demo #resolve
declare var require: any;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  readonly VAPID_PUBLIC =
    "BMlC2dLJTBP6T1GCl3S3sDBmhERNVcjN7ff2a6JAoOg8bA_qXjikveleRwjz0Zn8c9-58mnrNo2K4p07UPK0DKQ";

  constructor(private swPush: SwPush, private servicio: AutencacionService) {}

  ngOnInit() {
    console.log("Console log del console log");
    if ("serviceWorker" in navigator) {
      // Estamos usanto un timer para dejar al browser cargar el sw. #resolve
      navigator.serviceWorker.register("ngsw-worker.js").then(swreg => {
        if (swreg.active) {
          console.log("Registered the service worker");
          this.subscribeToNotifications();
        }
      });
    }
  }

  obra = require("../../img/acto.jpg");
  desfile = require("../../img/desfile.jpg");

  subscribeToNotifications() {
    console.log("Home: subscribeToNotif()");
    this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC
      })
      .then(pushsub => {
        console.log('Home: Subscripcion a notif: ');
        this.servicio.addPushSubscriber(pushsub).subscribe((res) => {
          console.log(res.message);
        });
      })
      .catch(err => console.error("Could not subscribe to notifications", err));
  }

  testNP() {
    console.log("testNP()");
    this.servicio.testNP().subscribe((res) => {
      console.log(res.message);
    });;
  }
}
