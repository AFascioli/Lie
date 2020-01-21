import { async } from "@angular/core/testing";
import { EventosService } from "./../eventos/eventos.service";
import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Router } from "@angular/router";
import { Evento } from "../eventos/evento.model";
import { MatSnackBar, MatDialogRef } from "@angular/material";

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

  evento: Evento;
  constructor(
    public snackBar: MatSnackBar,
    private swPush: SwPush,
    private servicio: AutenticacionService,
    public router: Router,
    public servicioEvento: EventosService
  ) {}

  ngOnInit() {
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
          this.servicio.addPushSubscriber(pushsub).subscribe(res => {
            console.log("Se suscribió a recibir notificaciones push.");
          });
        })
        .catch(err =>
          console.error("No se pudo suscribir a las notificaciones push.", err)
        );
    }
  }
  onEditar(titulo: string) {
    this.servicioEvento.buscarEvento(titulo).subscribe(response => {
      this.servicioEvento.evento = response.evento[0];
      this.router.navigate(["./verEvento"]);
    });
  }
  onBorrar(titulo: string) {
    this.servicioEvento.eliminarEvento(titulo);
  }

  conocerUsuarioLogueado(): boolean {
    let mostrarBoton = false;
    if (
      this.servicio.getRol() == "Admin" // ||    this.servicio.getUsuarioAutenticado() == this.servicioEvento.evento.autor
    )
      mostrarBoton = true;
    return mostrarBoton;
  }
}
/*
@Component({
  selector: "app-borrar-popup",
  templateUrl: "./borrar-popup.component.html",
  styleUrls: ["./home.component.css"]
})
export class MostrarPopupComponent {
  tipoPopup: string;
  formInvalido: Boolean;
  borrar: string;

  constructor(
    public dialogRef: MatDialogRef<MostrarPopupComponent>,
    public router: Router,
    public servicioEvento: EventosService,
    public home: Home
  ) {
    this.borrar = "¿Está seguro que desea borrar el evento?";
  }

  onYesClick(): void {
    this.router.navigate(["./buscar/lista"]);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onOkClickBorrar(): void {
    this.dialogRef.close();
    this.router.navigate(["./buscar/lista"]);
  }

  onYesDeleteClick() {
  }
}
*/
